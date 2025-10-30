{
  "variables": {
    "common_cflags_cc": [
      "-std=c++20",
      "-O3",
      "-flto=auto",
      "-fuse-linker-plugin",
      "-funroll-loops",
      "-fomit-frame-pointer",
      "-fdata-sections",
      "-ffunction-sections",
      "-fexceptions",
      "-Wno-deprecated-declarations",
      "-Wno-reorder",
      "-Wno-unused-variable",
      "-Wno-unused-parameter",
      "-Wno-sign-compare"
    ],
    "common_ldflags": [
      "-Wl,--as-needed",
      "-Wl,--gc-sections"
    ],
    "common_includes": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "/usr/include",
      "/usr/local/include"
    ]
  },

  "targets": [
    {
      "target_name": "sticker",
      "sources": ["src/sticker.cpp"],
      "include_dirs": ["<@(common_includes)"],
      "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
      "cflags_cc": ["<@(common_cflags_cc)"],
      "ldflags": ["<@(common_ldflags)"],
      "defines": ["NAPI_CPP_EXCEPTIONS"],
      "libraries": [
        "-lwebp",
        "-lwebpmux",
        "-lwebpdemux",
        "-lavformat",
        "-lavcodec",
        "-lavutil",
        "-lswresample",
        "-lswscale"
      ]
    },
    {
      "target_name": "converter",
      "sources": ["src/converter.cpp"],
      "include_dirs": ["<@(common_includes)"],
      "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
      "cflags_cc": ["<@(common_cflags_cc)"],
      "ldflags": ["<@(common_ldflags)"],
      "defines": ["NAPI_CPP_EXCEPTIONS"],
      "libraries": [
        "-lavformat",
        "-lavcodec",
        "-lavutil",
        "-lswresample",
        "-lswscale"
      ]
    },
    {
      "target_name": "fetch",
      "sources": ["src/fetch.cpp"],
      "include_dirs": ["<@(common_includes)"],
      "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
      "cflags_cc": [
        "<@(common_cflags_cc)",
        "-Wno-unused-but-set-variable"
      ],
      "ldflags": ["<@(common_ldflags)"],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "CURL_STATICLIB",
        "CURL_DISABLE_VERBOSE_STRINGS",
        "CURL_DISABLE_DEBUG",
        "CURL_DISABLE_DICT",
        "CURL_DISABLE_TFTP",
        "CURL_DISABLE_RTSP"
      ],
      "libraries": [
        "-lcurl",
        "-lssl",
        "-lcrypto",
        "-lz",
        "-lnghttp2"
      ]
    }
  ]
}