import Foundation
import Network

@objc(VideoConverterModule)
class VideoConverterModule: NSObject {

  private var listener: NWListener?
  private var serverPort: UInt16 = 0
  private var servingPath: String = ""

  @objc
  func startServer(
    _ path: String,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if listener != nil {
      resolve("http://localhost:\(serverPort)")
      return
    }

    servingPath = path

    do {
      let params = NWParameters.tcp
      let listener = try NWListener(using: params, on: .any)

      listener.stateUpdateHandler = { [weak self] state in
        switch state {
        case .ready:
          if let port = listener.port {
            self?.serverPort = port.rawValue
            resolve("http://localhost:\(port.rawValue)")
          }
        case .failed(let error):
          reject("E_SERVER", error.localizedDescription, error)
        default:
          break
        }
      }

      listener.newConnectionHandler = { [weak self] connection in
        self?.handleConnection(connection)
      }

      listener.start(queue: DispatchQueue(label: "com.lstream.localserver"))
      self.listener = listener
    } catch {
      reject("E_SERVER", error.localizedDescription, error)
    }
  }

  private func handleConnection(_ connection: NWConnection) {
    connection.start(queue: DispatchQueue(label: "com.lstream.localserver.conn"))
    connection.receive(minimumIncompleteLength: 1, maximumLength: 8192) { [weak self] data, _, _, _ in
      guard let self = self, let data = data, let request = String(data: data, encoding: .utf8) else {
        connection.cancel()
        return
      }
      self.processRequest(request, connection: connection)
    }
  }

  private func processRequest(_ request: String, connection: NWConnection) {
    let lines = request.components(separatedBy: "\r\n")
    guard let firstLine = lines.first else {
      connection.cancel()
      return
    }

    let parts = firstLine.components(separatedBy: " ")
    guard parts.count >= 2 else {
      connection.cancel()
      return
    }

    let rawPath = parts[1]
    let decodedPath = rawPath.removingPercentEncoding ?? rawPath
    let filePath = servingPath + decodedPath

    guard FileManager.default.fileExists(atPath: filePath),
          let fileData = try? Data(contentsOf: URL(fileURLWithPath: filePath)) else {
      let response = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
      connection.send(content: response.data(using: .utf8), completion: .contentProcessed { _ in
        connection.cancel()
      })
      return
    }

    let contentType = self.mimeType(for: filePath)
    let header = "HTTP/1.1 200 OK\r\nContent-Type: \(contentType)\r\nContent-Length: \(fileData.count)\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n"

    var responseData = header.data(using: .utf8)!
    responseData.append(fileData)

    connection.send(content: responseData, completion: .contentProcessed { _ in
      connection.cancel()
    })
  }

  private func mimeType(for path: String) -> String {
    if path.hasSuffix(".m3u8") { return "application/vnd.apple.mpegurl" }
    if path.hasSuffix(".ts") { return "video/mp2t" }
    if path.hasSuffix(".mp4") { return "video/mp4" }
    if path.hasSuffix(".mp3") { return "audio/mpeg" }
    return "application/octet-stream"
  }

  @objc
  func convertTsToMp4(
    _ inputPath: String,
    outputPath: String,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(inputPath)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
