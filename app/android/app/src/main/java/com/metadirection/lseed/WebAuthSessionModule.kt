package com.metadirection.lseed

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsService
import androidx.browser.customtabs.CustomTabsServiceConnection
import androidx.browser.customtabs.CustomTabsSession
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WebAuthSessionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener, LifecycleEventListener {

    private var pendingPromise: Promise? = null
    private var expectedHost: String? = null
    private var expectedPath: String? = null
    private var customTabsSession: CustomTabsSession? = null
    private var authInProgress = false

    private val serviceConnection = object : CustomTabsServiceConnection() {
        override fun onCustomTabsServiceConnected(name: ComponentName, client: CustomTabsClient) {
            Log.d(TAG, "CustomTabs service connected: $name")
            customTabsSession = client.newSession(null)
            Log.d(TAG, "CustomTabs session created: ${customTabsSession != null}")
        }
        override fun onServiceDisconnected(name: ComponentName?) {
            Log.d(TAG, "CustomTabs service disconnected")
            customTabsSession = null
        }
    }

    init {
        reactContext.addActivityEventListener(this)
        reactContext.addLifecycleEventListener(this)
        bindCustomTabsService()
    }

    private fun bindCustomTabsService() {
        var packageName = CustomTabsClient.getPackageName(reactContext, null)
        Log.d(TAG, "CustomTabs packageName from getPackageName: $packageName")

        if (packageName == null) {
            val intent = Intent(CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION)
            val resolveInfos = reactContext.packageManager.queryIntentServices(intent, PackageManager.MATCH_ALL)
            Log.d(TAG, "Available CustomTabs services: ${resolveInfos.map { it.serviceInfo.packageName }}")
            packageName = resolveInfos.firstOrNull()?.serviceInfo?.packageName
        }

        if (packageName == null) {
            Log.e(TAG, "No CustomTabs service available")
            return
        }

        Log.d(TAG, "Binding to: $packageName")
        try {
            val bound = CustomTabsClient.bindCustomTabsService(reactContext, packageName, serviceConnection)
            Log.d(TAG, "bindCustomTabsService result: $bound")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to bind CustomTabs service", e)
        }
    }

    companion object {
        private const val TAG = "WebAuthSession"
    }

    override fun getName(): String = "WebAuthSessionModule"

    @ReactMethod
    fun openAuthSession(url: String, callbackHost: String, callbackPath: String, promise: Promise) {
        pendingPromise = promise
        expectedHost = callbackHost
        expectedPath = callbackPath

        try {
            val activity = reactContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No activity available")
                pendingPromise = null
                return
            }

            val session = customTabsSession
            Log.d(TAG, "openAuthSession - session: ${session != null}")

            val builder = CustomTabsIntent.Builder(session)

            if (session != null) {
                val displayMetrics = activity.resources.displayMetrics
                val height = (displayMetrics.heightPixels * 0.9).toInt()
                Log.d(TAG, "Setting partial height: $height")
                builder.setInitialActivityHeightPx(height)
            } else {
                Log.d(TAG, "No session, falling back to full Custom Tabs")
            }

            val customTabsIntent = builder.build()
            authInProgress = true
            customTabsIntent.launchUrl(activity, Uri.parse(url))
        } catch (e: Exception) {
            promise.reject("AUTH_ERROR", e.message, e)
            pendingPromise = null
        }
    }

    fun handleCallback(uri: Uri): Boolean {
        Log.d(TAG, "handleCallback: uri=$uri, pendingPromise=${pendingPromise != null}, expectedHost=$expectedHost, expectedPath=$expectedPath, authInProgress=$authInProgress")
        val promise = pendingPromise ?: return false
        val host = expectedHost ?: return false
        val path = expectedPath ?: return false

        Log.d(TAG, "handleCallback match: host=${uri.host}==$host, path=${uri.path}==$path")
        if (uri.host == host && uri.path == path) {
            authInProgress = false
            Log.d(TAG, "handleCallback: RESOLVED")
            promise.resolve(uri.toString())
            pendingPromise = null
            expectedHost = null
            expectedPath = null
            return true
        }
        return false
    }

    override fun onNewIntent(intent: Intent) {
        Log.d(TAG, "onNewIntent: ${intent.data}")
        val uri = intent.data ?: return
        handleCallback(uri)
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
    }

    override fun onHostResume() {
        if (authInProgress) {
            Handler(Looper.getMainLooper()).postDelayed({
                if (!authInProgress) return@postDelayed
                authInProgress = false
                val promise = pendingPromise ?: return@postDelayed
                pendingPromise = null
                expectedHost = null
                expectedPath = null
                promise.reject("USER_CANCELLED", "User cancelled")
            }, 500)
        }
    }

    override fun onHostPause() {}
    override fun onHostDestroy() {}
}
