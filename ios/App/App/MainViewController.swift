import Capacitor

// Native iOS feel for the Countrivo WebView.
//
// SETUP (one-time, in Xcode): open Base.lproj/Main.storyboard, select the
// Bridge View Controller, and set Identity Inspector > Custom Class to
// "MainViewController". (CSS overscroll-behavior is ignored by WKWebView, so
// the bounce must be disabled here in native code.)
class MainViewController: CAPBridgeViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    if let scrollView = self.webView?.scrollView {
      scrollView.bounces = false
      scrollView.alwaysBounceVertical = false
      scrollView.alwaysBounceHorizontal = false
      scrollView.contentInsetAdjustmentBehavior = .never
    }
    // Native iOS edge-swipe-back (no JS/config equivalent exists).
    self.webView?.allowsBackForwardNavigationGestures = true
  }
}
