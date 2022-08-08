(function () {
  const elementId = "#orcidWidget";
  const sandboxIssuer = "https://sandbox.orcid.org";
  const sandboxUrl = "https://sandbox.orcid.org/oauth/authorize";
  const sandboxKey = {
    kty: "RSA",
    e: "AQAB",
    use: "sig",
    kid: "sandbox-orcid-org-3hpgosl3b6lapenh1ewsgdob3fawepoj",
    n: "pl-jp-kTAGf6BZUrWIYUJTvqqMVd4iAnoLS6vve-KNV0q8TxKvMre7oi9IulDcqTuJ1alHrZAIVlgrgFn88MKirZuTqHG6LCtEsr7qGD9XyVcz64oXrb9vx4FO9tLNQxvdnIWCIwyPAYWtPMHMSSD5oEVUtVL_5IaxfCJvU-FchdHiwfxvXMWmA-i3mcEEe9zggag2vUPPIqUwbPVUFNj2hE7UsZbasuIToEMFRZqSB6juc9zv6PEUueQ5hAJCEylTkzMwyBMibrt04TmtZk2w9DfKJR91555s2ZMstX4G_su1_FqQ6p9vgcuLQ6tCtrW77tta-Rw7McF_tyPmvnhQ",
  };
  const prodIssuer = "https://orcid.org";
  const prodUrl = "https://orcid.org/oauth/authorize";
  const prodKey = {
    kty: "RSA",
    e: "AQAB",
    use: "sig",
    kid: "production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs",
    n: "jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ",
  };

  var authUrl;
  var clientId;
  var env;
  var issuer;
  var jQuery; // Localize jQuery variable to avoid conflicts with other versions a site may be using
  var key;
  var nonce;
  var pubKey;
  var redirectUri;
  var scopes;
  var signedInIdToken;
  var size;
  var state;
  var submitUri;
  var id_token_g;

  /******** Load jQuery if not present *********/
  if (window.jQuery === undefined || window.jQuery.fn.jquery !== "2.2.4") {
    var script_tag = document.createElement("script");
    script_tag.setAttribute("type", "text/javascript");
    script_tag.setAttribute("src", "https://code.jquery.com/jquery-2.2.4.js");
    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () {
        // For old versions of IE
        if (this.readyState == "complete" || this.readyState == "loaded") {
          scriptLoadHandler();
        }
      };
    } else {
      script_tag.onload = scriptLoadHandler;
    }
    // Try to find the head, otherwise default to the documentElement
    (
      document.getElementsByTagName("head")[0] || document.documentElement
    ).appendChild(script_tag);
  } else {
    // The jQuery version on the window is the one we want to use
    jQuery = window.jQuery;

    init();
  }
  /******** Called once jQuery has loaded ******/
  function scriptLoadHandler() {
    // Restore $ and window.jQuery to their previous values and store the
    // new jQuery in our local jQuery variable
    jQuery = window.jQuery.noConflict(true);
    // Call our main function
    init();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function demo() {
    for (let i = 0; i < 10; i++) {
      console.log(`Waiting ${i} seconds...`);
      await sleep(i * 1000);
    }
    console.log("Done");
  }
  var password = "";

  function init() {
    jQuery(document).ready(function ($) {
      clientId = $(elementId).data("clientid");
      env = $(elementId).data("env");
      nonce = $(elementId).data("nonce");
      redirectUri = $(elementId).data("redirecturi");
      scopes = $(elementId).data("scopes");
      size = $(elementId).data("size");
      state = getQueryParameterByName("state");
      submitUri = $(elementId).data("submituri");

      if (env === "production") {
        issuer = prodIssuer;
        authUrl = prodUrl;
        key = prodKey;
      } else {
        issuer = sandboxIssuer;
        authUrl = sandboxUrl;
        key = sandboxKey;
      }

      if (size == "lg") {
        $(elementId).addClass("large");
      } else {
        $(elementId).addClass("small");
      }

      /******* Load CSS *******/
      var css_link = $("<link>", {
        rel: "stylesheet",
        type: "text/css",
        href: "orcid-widget.css",
      });
      css_link.appendTo("head");

      /******* Load jsrasign  *******/
      $.getScript(
        "https://kjur.github.io/jsrsasign/jsrsasign-latest-all-min.js",
        function (data, textStatus, jqxhr) {
          //check for response - if exists process it
          if (getFragmentParameterByName("id_token")) {
            var id_token = getFragmentParameterByName("id_token");
			id_token_g = id_token;
            if (id_token) {
              if (checkSig(id_token)) {
                signedInIdToken = JSON.parse(
                  KJUR.jws.JWS.parse(id_token).payloadPP
                );
                if (submitUri) {
                  submitIdTokenData($, id_token, signedInIdToken, password);
                } else {
                  console.log("running no submit uri");
                  alert("submituri not found");
                  showSuccess($, id_token, signedInIdToken);
                }
              } else {
                console.log(141);
                signedInIdToken = null;
                showError($);
              }
            }
          } else if (getFragmentParameterByName("error")) {
            var error = getFragmentParameterByName("error");
            if ("access_denied" === error) {
              submitUserDenied($);
            } else {
              showError($);
            }
          }
          //if we don't have an id_token or a signed in user, show sign in button
          else {
            showAuthButton($);
          }

          $("#removeOrcidId").click(function () {
            $(elementId).empty();
            showAuthButton($);
          });
        }
      );
    });
  }

  function buildReturnUrl(nonce) {
    var url =
      authUrl +
      "?response_type=token&redirect_uri=" +
      redirectUri +
      "&client_id=" +
      clientId +
      "&scope=openid";
    // if(scopes) {
    // 	url += "%20"+scopes;
    // }
    if (nonce) url += "&nonce=" + nonce;
    if (state) url += "&state=" + state;
    return url;
  }

  function checkSig(id_token) {
    pubKey = KEYUTIL.getKey(key);
    return KJUR.jws.JWS.verifyJWT(id_token, pubKey, {
      alg: ["RS256"],
      iss: [issuer],
      aud: clientId,
      gracePeriod: 15 * 60, //15 mins skew allowed
    });
  }

  function getFragmentParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&]" + name + "=([^&#]*)"),
      results = regex.exec(window.location.hash);
    return results === null
      ? ""
      : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  function getQueryParameterByName(name) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  function showPasswordInput() {
    // document.getElementById('password').innerHTML = '<div>Create New password for Scholar-Chat<label for="pwd">Password:</label><input type="password" id="pwd" name="pwd"></div>'
    // document.getElementById('submitButton').innerHTML = '<input type="submit" onsubmit="submitData" value="Submit">'
    document.getElementById("password").style.visibility = "visible";
  }

  function hidePasswordInput() {
    document.getElementById("password").style.visibility = "hidden";
  }

  function showAuthButton($) {
    $(
      '<a id="orcidAuthButton" href=' +
        buildReturnUrl() +
        '><img src="https://orcid.org/sites/default/files/images/orcid_24x24.png" />Connect your ORCID iD</a>'
    ).appendTo(elementId);
  }

  function showError($) {
    $(
      '<p id="orcidAuthFail">Oops, something went terribly wrong<br> and we couldn\'t fetch your ORCID iD</p>'
    ).appendTo(elementId);
  }

  function showDenied($) {
    $(
      '<p id="orcidAuthFail">Oops, you have denied access<br> so we will not be able to update your ORCID iD</p>'
    ).appendTo(elementId);
  }

  function showSuccess($, id_token, signedInIdToken) {
    $(
      '<p id="orcidAuthSuccess"><b>Thanks, ' +
        signedInIdToken.given_name +
        "  " +
        signedInIdToken.family_name +
        '!</b><br><img src="https://orcid.org/sites/default/files/images/orcid_24x24.png"/><a target="_orcidRecord" href="' +
        issuer +
        '/my-orcid">' +
        issuer +
        "/" +
        signedInIdToken.sub +
        "</a></p>"
    ).appendTo(elementId);
    //Add hidden inputs with ORCID info
    $("<input>")
      .attr({
        type: "hidden",
        id: "orcidId",
        name: "orcidId",
        value: signedInIdToken.iss + "/" + signedInIdToken.sub,
      })
      .appendTo(elementId);
    $("<input>")
      .attr({
        type: "hidden",
        id: "orcidGivenName",
        name: "orcidGivenName",
        value: signedInIdToken.given_name,
      })
      .appendTo(elementId);
    $("<input>")
      .attr({
        type: "hidden",
        id: "orcidFamilyName",
        name: "orcidFamilyName",
        value: signedInIdToken.family_name,
      })
      .appendTo(elementId);
    $("<input>")
      .attr({
        type: "hidden",
        id: "orcidIdToken",
        name: "orcidIdToken",
        value: id_token,
      })
      .appendTo(elementId);
    if (state) {
      $("<input>")
        .attr({
          type: "hidden",
          id: "orcidState",
          name: "orcidState",
          value: state,
        })
        .appendTo(elementId);
    }
  }

  const btn = document.getElementById("finalbtn");

  btn.addEventListener("click", () => {
    console.log("hitting");
    // console.log(document.getElementById('pwd').value)
    submitData();
    alert("Registeration Done");
  });

  function submitData() {
    console.log("Submiting data");
  
    jQuery.ajax({
      url: submitUri,
      type: "POST",
      data: JSON.stringify({ name: signedInIdToken.given_name, orcid: signedInIdToken.sub, password: document.getElementById('pwd').value }),
      contentType: "application/json; charset=utf-8",
    })
      .done(function () {
		hidePasswordInput()
		document.getElementById('para').innerHTML = '<h1>Thankyou for registering to Scholar Chat! <br> Please Login <a href="https://scholar-chat-orcid.herokuapp.com">here</a> </h1>'
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        showError($);
      });
  }

  function submitIdTokenData($, id_token, signedInIdToken, password) {
 
    showPasswordInput();

    showSuccess($, id_token, signedInIdToken);
  }

  function submitUserDenied($) {
    $.ajax({
      url: submitUri,
      type: "POST",
      data: JSON.stringify({ denied: true, state: state }),
      contentType: "application/json; charset=utf-8",
    })
      .done(function () {
        showDenied($);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        showError($);
      });
  }
})();
