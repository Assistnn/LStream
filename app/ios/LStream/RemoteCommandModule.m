#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RemoteCommandModule, NSObject)
RCT_EXTERN_METHOD(configure:(double)skipInterval)
@end
