import Foundation

@objc(CacheManagerModule)
class CacheManagerModule: NSObject {

  @objc
  func clearHttpCache(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    URLCache.shared.removeAllCachedResponses()
    resolve(nil)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
