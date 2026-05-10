package com.metadirection.lseed

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CacheManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CacheManagerModule"

    @ReactMethod
    fun clearHttpCache(promise: Promise) {
        try {
            reactApplicationContext.cacheDir.deleteRecursively()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CACHE_CLEAR_ERROR", e.message, e)
        }
    }
}
