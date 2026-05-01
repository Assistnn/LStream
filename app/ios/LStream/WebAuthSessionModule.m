#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WebAuthSessionModule, NSObject)

RCT_EXTERN_METHOD(openAuthSession:(NSString *)url
                  callbackHost:(NSString *)callbackHost
                  callbackPath:(NSString *)callbackPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
