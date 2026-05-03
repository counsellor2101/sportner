package com.sportner.app;

import android.os.Bundle;
import android.webkit.WebView;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView.setWebContentsDebuggingEnabled(true);

        getBridge().getWebView().addJavascriptInterface(
            new Object() {
                @android.webkit.JavascriptInterface
                public void openAppSettings() {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    Uri uri = Uri.fromParts("package", getPackageName(), null);
                    intent.setData(uri);
                    startActivity(intent);
                }
            },
            "Android"
        );
    }
}