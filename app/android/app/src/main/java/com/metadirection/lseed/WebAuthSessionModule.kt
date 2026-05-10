package com.metadirection.lseed

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WebAuthSessionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pendingPromise: Promise? = null
    private var expectedHost: String? = null
    private var expectedPath: String? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "WebAuthSessionModule"

    @ReactMethod
    fun openAuthSession(url: String, callbackHost: String, callbackPath: String, promise: Promise) {
        pendingPromise = promise
        expectedHost = callbackHost
        expectedPath = callbackPath

        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No activity available")
                pendingPromise = null
                return
            }

            val customTabsIntent = CustomTabsIntent.Builder().build()
            customTabsIntent.launchUrl(activity, Uri.parse(url))
        } catch (e: Exception) {
            promise.reject("AUTH_ERROR", e.message, e)
            pendingPromise = null
        }
    }

    fun handleCallback(uri: Uri): Boolean {
        val promise = pendingPromise ?: return false
        val host = expectedHost ?: return false
        val path = expectedPath ?: return false

        if (uri.host == host && uri.path == path) {
            promise.resolve(uri.toString())
            pendingPromise = null
            expectedHost = null
            expectedPath = null
            return true
        }
        return false
    }

    override fun onNewIntent(intent: android.content.Intent?) {
        val uri = intent?.data ?: return
        handleCallback(uri)
    }

    @Suppress("DEPRECATION")
    override fun onActivityResult(
        activity: android.app.Activity?,
        requestCode: Int,
        resultCode: Int,
        data: android.content.Intent?
    ) {
        // Not used for Custom Tabs
    }
}
