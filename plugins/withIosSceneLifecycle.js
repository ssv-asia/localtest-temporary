const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

const MARKER = '// expert-ai-ios-scene-lifecycle';

const SCENE_DELEGATE = `

${MARKER}
class ExpertAISceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    var launchOptions = appDelegate.launchOptions ?? [:]
    if let shortcutItem = connectionOptions.shortcutItem,
       let route = shortcutItem.userInfo?["route"] as? String,
       let shortcutURL = URL(string: "expertai:///\\(route)") {
      launchOptions[.url] = shortcutURL
    }
    for context in connectionOptions.urlContexts {
      launchOptions[.url] = context.url
      if let sourceApplication = context.options.sourceApplication {
        launchOptions[.sourceApplication] = sourceApplication
      }
      if let annotation = context.options.annotation {
        launchOptions[.annotation] = annotation
      }
      launchOptions[.openInPlace] = context.options.openInPlace

      var openOptions: [UIApplication.OpenURLOptionsKey: Any] = [
        .openInPlace: context.options.openInPlace,
      ]
      if let sourceApplication = context.options.sourceApplication {
        openOptions[.sourceApplication] = sourceApplication
      }
      if let annotation = context.options.annotation {
        openOptions[.annotation] = annotation
      }
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: openOptions)
    }

    for activity in connectionOptions.userActivities {
      launchOptions[.userActivityType] = activity.activityType
      launchOptions[.userActivityDictionary] = [activity.activityType: activity]
      _ = appDelegate.application(
        UIApplication.shared,
        continue: activity,
        restorationHandler: { _ in }
      )
    }

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions
    )
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    for context in URLContexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [
        .openInPlace: context.options.openInPlace,
      ]
      if let sourceApplication = context.options.sourceApplication {
        options[.sourceApplication] = sourceApplication
      }
      if let annotation = context.options.annotation {
        options[.annotation] = annotation
      }
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }

  func windowScene(
    _ windowScene: UIWindowScene,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      completionHandler(false)
      return
    }
    appDelegate.application(
      UIApplication.shared,
      performActionFor: shortcutItem,
      completionHandler: completionHandler
    )
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidBecomeActive?(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillResignActive?(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillEnterForeground?(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidEnterBackground?(UIApplication.shared)
  }

  func sceneDidDisconnect(_ scene: UIScene) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          appDelegate.window === window else {
      return
    }
    appDelegate.window = nil
    window = nil
  }
}
`;

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes(MARKER)) return config;

    const windowLine = /^[ \t]*window = UIWindow\(frame: UIScreen\.main\.bounds\)\r?\n/m;
    const startReactNative = /^[ \t]*factory\.startReactNative\(\r?\n[ \t]*withModuleName: "main",\r?\n[ \t]*in: window,\r?\n[ \t]*launchOptions: [A-Za-z_][A-Za-z0-9_]*\)\r?\n/m;

    if (!windowLine.test(contents) || !startReactNative.test(contents)) {
      throw new Error(
        'withIosSceneLifecycle: Expo AppDelegate template changed; review the scene lifecycle migration before building.'
      );
    }

    const launchOptionsName = contents.includes('var reactLaunchOptions = launchOptions ?? [:]')
      ? 'reactLaunchOptions'
      : 'launchOptions';
    contents = contents
      .replace(windowLine, `    self.launchOptions = ${launchOptionsName}\n`)
      .replace(startReactNative, '');

    const factoryProperty = '  var reactNativeFactory: RCTReactNativeFactory?\n';
    if (!contents.includes(factoryProperty)) {
      throw new Error('withIosSceneLifecycle: could not find the React Native factory property.');
    }
    contents = contents.replace(
      factoryProperty,
      `${factoryProperty}  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?\n`
    );

    config.modResults.contents = contents + SCENE_DELEGATE;
    return config;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    const expectedManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).ExpertAISceneDelegate',
          },
        ],
      },
    };
    const currentManifest = config.modResults.UIApplicationSceneManifest;
    if (currentManifest && JSON.stringify(currentManifest) !== JSON.stringify(expectedManifest)) {
      throw new Error('withIosSceneLifecycle: an unexpected scene manifest already exists.');
    }
    config.modResults.UIApplicationSceneManifest = expectedManifest;
    return config;
  });
}

module.exports = (config) => withSceneManifest(withSceneAppDelegate(config));
