import React from "react";

function createGUID() {
  let guid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    let r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  return guid;
}

/**
 * Compare our tab identifier associated with this session (particular tab)
 * with that of one that is in localStorage (the active one for this browser).
 * This browser tab is good if any of the following are true:
 * 1.  There is no localStorage Guid yet (first browser tab).
 * 2.  The localStorage Guid matches the session Guid.  Same tab, refreshed.
 * 3.  The localStorage timeout period has ended.
 *
 * If our current session is the correct active one, an interval will continue
 * to re-insert the localStorage value with an updated timestamp.
 *
 */
function testTab(
  localStorageTimeout,
  localStorageResetInterval,
  localStorageTabKey,
  sessionStorageGuidKey
) {
  let sessionGuid =
    sessionStorage.getItem(sessionStorageGuidKey) || createGUID();
  let tabObj = JSON.parse(localStorage.getItem(localStorageTabKey)) || null;

  sessionStorage.setItem(sessionStorageGuidKey, sessionGuid);

  // If no or stale tab object, our session is the winner.  If the guid matches, ours is still the winner
  if (
    tabObj === null ||
    tabObj.timestamp < new Date().getTime() - localStorageTimeout ||
    tabObj.guid === sessionGuid
  ) {
    const setTabObj = () => {
      let newTabObj = {
        guid: sessionGuid,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(localStorageTabKey, JSON.stringify(newTabObj));
    };

    setTabObj();
    setInterval(setTabObj, localStorageResetInterval);
    window.onunload = () => {
      localStorage.removeItem(localStorageTabKey);
    };
    return true;
  } else {
    // An active tab is already open that does not match our session guid.
    return false;
  }
}

const DefaultOnlyOneTabComponent = () => (
  <div>Sorry! You can only have this application opened in one tab</div>
);

// eslint-disable-next-line import/prefer-default-export
export function withOneTabEnforcer(
  WrappedComponent,
  {
    OnlyOneTabComponent = DefaultOnlyOneTabComponent,
    localStorageTimeout = 15 * 1000, // 15,000 milliseconds = 15 seconds.
    localStorageResetInterval = 10 * 1000, // 10,000 milliseconds = 10 seconds.
    appName = "default-app-name", // has to be unique!
    sessionStorageGuidKey = "browser-tab-guid"
  } = {}
) {
  // ...and returns another component...
  return props => {
    if (
      testTab(
        localStorageTimeout,
        localStorageResetInterval,
        appName,
        sessionStorageGuidKey
      )
    ) {
      return <WrappedComponent {...props} />;
    } else {
      return <OnlyOneTabComponent />;
    }
  };
}
