package com.metadirection.lseed

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class AuthRedirectActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val redirectIntent = Intent(this, MainActivity::class.java).apply {
            data = this@AuthRedirectActivity.intent.data
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        startActivity(redirectIntent)
        finish()
    }
}
