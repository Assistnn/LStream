#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VideoConverterModule, NSObject)

RCT_EXTERN_METHOD(startServer:(NSString *)path
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(convertTsToMp4:(NSString *)inputPath
                  outputPath:(NSString *)outputPath
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
