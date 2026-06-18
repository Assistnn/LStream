#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CacheManagerModule, NSObject)

RCT_EXTERN_METHOD(clearHttpCache:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
