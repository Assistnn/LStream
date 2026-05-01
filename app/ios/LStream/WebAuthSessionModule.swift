import AuthenticationServices
import UIKit

@objc(WebAuthSessionModule)
class WebAuthSessionModule: NSObject {

  private var currentSession: ASWebAuthenticationSession?

  @objc
  func openAuthSession(
    _ url: String,
    callbackHost: String,
    callbackPath: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let authURL = URL(string: url) else {
      reject("INVALID_URL", "Invalid URL", nil)
      return
    }

    DispatchQueue.main.async { [weak self] in
      let session = ASWebAuthenticationSession(
        url: authURL,
        callback: .https(host: callbackHost, path: callbackPath)
      ) { callbackURL, error in
        self?.currentSession = nil

        if let error = error as? ASWebAuthenticationSessionError,
           error.code == .canceledLogin {
          reject("USER_CANCELLED", "User cancelled", nil)
          return
        }

        if let error = error {
          reject("AUTH_ERROR", error.localizedDescription, error)
          return
        }

        guard let callbackURL = callbackURL else {
          reject("NO_URL", "No callback URL received", nil)
          return
        }

        resolve(callbackURL.absoluteString)
      }

      session.presentationContextProvider = self
      session.prefersEphemeralWebBrowserSession = false
      self?.currentSession = session
      session.start()
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

extension WebAuthSessionModule: ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow } ?? ASPresentationAnchor()
  }
}
