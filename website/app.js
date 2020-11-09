var Header = (function () {
  function throttle(callback, limit) {
    var inProgress = false;

    return function () {
      var _this = this;
      var _args = arguments;

      if (!inProgress) {
        callback.apply(_this, _args);
        inProgress = true;

        setTimeout(function () {
          inProgress = false;
        }, limit);
      }
    };
  }

  var header = document.querySelector(".js-header");
  var heroSection = document.querySelector(".js-hero");

  function handleContentVisibility() {
    if (window.pageYOffset > heroSection.offsetHeight) {
      header.classList.add("is-sticky");
    } else {
      header.classList.remove("is-sticky");
    }
  }

  var throttleHeaderContentVisibility = throttle(handleContentVisibility, 200);

  function initContentVisibility() {
    if (heroSection) {
      window.addEventListener("scroll", throttleHeaderContentVisibility);
    } else {
      header.classList.add("is-sticky");
    }
  }

  return {
    initContentVisibility: initContentVisibility,
  };
})();

var LazyLoadVideos = (function () {
  function init() {
    var lazyVideos = [].slice.call(document.querySelectorAll("video.js-lazy"));

    if ("IntersectionObserver" in window) {
      var lazyVideoObserver = new IntersectionObserver(function (
        entries,
        observer
      ) {
        entries.forEach(function (video) {
          if (video.isIntersecting) {
            var videoSource = video.target;

            videoSource.src = videoSource.dataset.src;
            videoSource.load();
            videoSource.classList.remove("js-lazy");
            lazyVideoObserver.unobserve(videoSource);
          }
        });
      });

      lazyVideos.forEach(function (lazyVideo) {
        lazyVideoObserver.observe(lazyVideo);
      });
    } else {
      lazyVideos.forEach(function (lazyVideo) {
        var videoSource = lazyVideo.target;

        videoSource.src = videoSource.dataset.src;
        videoSource.load();
        videoSource.classList.remove("js-lazy");
        lazyVideoObserver.unobserve(videoSource);
      });
    }
  }

  return {
    init: init,
  };
})();

var Tracking = (function () {
  function trackEvent(element) {
    if (typeof ga !== "undefined") {
      ga(
        "send",
        "event",
        element.getAttribute("data-cat"),
        element.getAttribute("data-act"),
        element.getAttribute("data-lab")
      );
    }
  }

  function attachEvents() {
    var elements = document.getElementsByClassName("js-ga");

    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];

      element.addEventListener("click", trackEvent.bind(this, element));
    }
  }

  function sendPageView() {
    if (typeof ga !== "undefined") {
      ga("send", "event", "page", "view", document.title || "");
    }
  }

  return {
    attachEvents: attachEvents,
    sendPageView: sendPageView,
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  LazyLoadVideos.init();
  Header.initContentVisibility();

  // tracking
  Tracking.sendPageView();
  Tracking.attachEvents();
});
