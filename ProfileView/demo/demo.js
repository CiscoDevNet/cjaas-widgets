let DEFAULT_KEY =
  "st=demostore&so=sandbox&ss=datasink&sp=w&se=2021-04-23T18:25:43.511Z&sk=sandbox&sig=TEUtd3qKp6pYjoTM7GEHDZeKRfnIWr90MQoW6r2xsB0=";

function connectToDB(ev) {
  let element = document.getElementById("cjs-widget");
  // let el1 = document.getElementById('cjs-tape');
  let input = document.querySelector("#token-input");
  let token = input.value || DEFAULT_KEY;

  if (token && token.trim()) {
    let key = token;

    element.setAttribute("stream-id", key);
    // el1.setAttribute('stream-id', key) ;
    // el1.limit = 10;
    // el1.type = 'journey';
  }
}

function sendEvent() {
  let eventName = document.getElementById("event-name").value;
  let eventData = document.getElementById("event-data").value;
  let input = document.querySelector("#token-input");
  let token = input.value || DEFAULT_KEY;

  if (window.cjaasRequests) {
    let req = window.cjaasRequests;
    req.setToken(token);

    req.post(eventName, { "Custom Data": eventData }, "Demo User", "anon-XYZ");
  }
}

function recordCallWrap() {
  let input = document.querySelector("#token-input");
  let token = input.value || DEFAULT_KEY;

  if (window.cjaasRequests) {
    let req = window.cjaasRequests;
    req.setToken(token);

    req.post(
      "Call Wrapped",
      {
        Sentiment: "Very Satisfied",
        "Issue Resolved": "Yes",
        Agent: "John"
      },
      "Demo User",
      "anon-XYZ"
    );
  }
}

function recordNPS() {
  let input = document.querySelector("#token-input");
  let token = input.value || DEFAULT_KEY;

  if (window.cjaasRequests) {
    let req = window.cjaasRequests;
    req.setToken(token);

    req.post(
      "NPS Rating",
      {
        Score: "9",
        Comments: "Agent was able to help with information I needed.",
        Agent: "John"
      },
      "Demo User",
      "anon-XYZ"
    );
  }
}

function sunglassReturned() {
  let input = document.querySelector("#token-input");
  let token = input.value || DEFAULT_KEY;

  if (window.cjaasRequests) {
    let req = window.cjaasRequests;
    req.setToken(token);

    req.post(
      "Product Return Received",
      {
        "Product Name": "Sun Glasses",
        "Product Id": "435",
        "Reason for return": "Arrived broken in the package"
      },
      "Demo User",
      "anon-XYZ"
    );
  }
}

function clearTape() {
  let input = document.querySelector("#token-input");
  let token = input.value || DEFAULT_KEY;

  let tenantName = document.getElementById("tenant-name").value;
  if (!tenantName && !tenantName.trim()) {
    alert("Tenant Name is required to clear tape");
    return;
  }
  fetch("https://trycjaas.exp.bz/cleartape/" + tenantName + "?" + token).then(
    (x) => {
      if (x) {
        alert("Tape Cleared for " + tenantName);
      }
    }
  );
}

function updateWidget() {
  let widget = document.querySelector("#cjs-widget");

  let form = getFormValue();

  widget.type = form.type;
  widget.filter = form.filter;

  if (form.paginator) {
    widget.paginator = form.paginator;
  }
  if (form.brandColor) {
    widget.style.setProperty("--cjs-brand-color", form.brandColor);
  }
}

function getFormValue() {
  let type = document.querySelector("md-radiogroup#type").selectedRadioValue;

  let filter = document.querySelector("md-input#filter-input").value.trim();
  let paginator = document
    .querySelector("md-input#paginator-input")
    .value.trim();
  let brandColor = document
    .querySelector("md-input#brand-color-input")
    .value.trim();

  return {
    type,
    filter,
    paginator,
    brandColor
  };
}

setTimeout(() => {
  connectToDB();
}, 1000);
