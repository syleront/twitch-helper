document.addEventListener("DOMContentLoaded", () => {
  const API = new TwitchApi();
  const listener = new DomChangesListener();

  listener.on("chatInputArea", (node) => {
    if (!node.dataset.thTimer) {
      node.dataset.thTimer = true;
      let nickname = document.location.pathname.replace("/", "");
      API.search(nickname).then((res) => {
        if (res.stream == null) return;

        let date = new Date(res.stream.created_at);
        let default_placeholder = node.getAttribute("placeholder");
        let i = setInterval(() => {
          if (document.body.contains(node)) {
            let formatted = toHHMMSS((new Date() - date) / 1000);
            node.placeholder = default_placeholder + "\nСтрим идёт: " + formatted;
          } else {
            clearInterval(i);
          }
        }, 1000);
      });
    }
  });
});

function TwitchApi() {
  this.search = (nickname, params) => {
    return new Promise((resolve) => {
      if (typeof nickname !== "string") throw "nickname must be a string";
      if (!params) params = {};

      params.client_id = "i4m120vkem9za5oybmy7v3dxf74roc";

      GM_xmlhttpRequest({
        method: "GET",
        url: "https://api.twitch.tv/kraken/streams/" + encodeURIComponent(nickname) + "?" + query_stringify(params),
        onload: (responseDetails) => {
          resolve(JSON.parse(responseDetails.responseText));
        }
      });
    });
  }
}

function DomChangesListener() {
  let events = [];

  this.emit = (name, data) => {
    events.forEach((e) => {
      if (e.name == name) {
        e._cb(data);
      }
    });
  }

  this.on = (name, _cb) => {
    events.push({ name, _cb });
  }

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.type == "textarea" && mutation.target.dataset.aTarget == "chat-input") {
        this.emit("chatInputArea", mutation.target);
      }
    });
  }).observe(document.body, {
    childList: true,
    subtree: true
  });
}

function query_stringify(obj) {
  if (typeof obj == "object") {
    return Object.entries(obj).map((e) => e[0] + "=" + encodeURIComponent(e[1])).join("&");
  } else {
    throw "Error: obj is not object";
  }
};

function toHHMMSS(date) {
  let sec = parseInt(date, 10);
  let hours = Math.floor(sec / 3600);
  let minutes = Math.floor((sec - (hours * 3600)) / 60);
  let seconds = sec - (hours * 3600) - (minutes * 60);
  let days = Math.floor(hours / 24, -1);

  if (hours < 10) hours = "0" + hours;
  if (minutes < 10) minutes = "0" + minutes;
  if (seconds < 10) seconds = "0" + seconds;

  return (days ? days + " :: " : "") + (hours - (24 * days)) + ":" + minutes + ":" + seconds;
};