<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="min-width=1000px" />
    <title>SKYRSS Reader</title>
    <link rel="stylesheet" href="app.css" type="text/css" media="all" />
    
    <script type="text/javascript" src="js/jquery-1.8.3.min.js"></script>
    <script type="text/javascript" src="js/jquery.ba-hashchange.min.js"></script>
    <script type="text/javascript" src="js/jquery.disableSelection.js"></script>
    <script type="text/javascript" src="js/date.format.js"></script>
    <script type="text/javascript" src="js/jquery.scrollTo-min.js"></script>
    <script type="text/javascript" src="js/jquery.jqote2.min.js"></script>
    <script type="text/javascript" src="js/api.js"></script>
    <script type="text/javascript" src="js/importgr.js"></script>
    <script type="text/javascript" src="js/app.js"></script>
    <script type="text/javascript" src="js/sprintf.js/src/sprintf.js"></script>
    
    <!-- jqote template for a feed item line -->
    <script type="text/html" id="tpl-feedline">
<![CDATA[
<li id="fl-<%= this.id %>" class="feedline">
  <table class="topRow">
  <tr>
    <td class="title <%= this.titleclass %>"><%! this.title %></td>
    <td class="date"><%= this.date %></td>
  </tr>
  </table>
  <div class="feedDetails" id="data-<%= this.id %>">
    <div><a class="fullLink" target="_blank" href="<%! this.href %>">Seite öffnen</a></div>
    <div class="author"><%! this.author %></div>
    <div class="fullText"></div>
  </div>
  <table class="bottomRow">
    <tr>
      <td><input type="checkbox" class="itemRead" id="itemread-<%= this.id %>"/> <label for="itemread-<%= this.id %>">Als ungelesen markieren</label></td>
      <td class="share">Teilen</td>
    </tr>
  </table>
</li>
]]>
    </script>
    
    <!-- jqote template for a feed list entry -->
    <script type="text/html" id="tpl-feedlist">
<![CDATA[
<li class="feed <%= this.liclass %>" id="fi-<%= this.id %>">
<% if(this.icon!="") { %>
  <img src="<%! this.icon %>" class="icon" />
<% } %>
  <a href="#feed/<%= this.id %>/" title="<%! this.desc %>"><%! this.title %> (<span class="unread_count"><%= this.unread %></span>)</a>
</li>
]]>    
    </script>
    
    
    <script type="text/plain" id="inject-height">
// This script gets injected into the content iframes.
// It tells the parent its inner height so that the iframe can be exactly fit
// and also tells the parent key presses to allow space-scrolling.
// This is not possible from outside because of same-origin policy.
function seth() {
  //tell parent our height
  window.parent.postMessage({
    type:"seth",
    scrollHeight:document.body.scrollHeight,
    myId:theId,
  },'*');
}
//Fire on onLoad as well as on DOMReady, so that the text can be read, even if not all images are loaded
//This is especially needed on mobile and other slow links
window.onload=function() {
  seth();
  var links=document.getElementsByTagName("a");
  for(var i=0;i<links.length;i++) {
    var link=links[i];
    if(link.href)
      link.target="_new";
  }
};
document.addEventListener('DOMContentLoaded',seth);

window.onkeypress=function(a) {
  //tell parent that a key was pressed (relay SPACE for scrolling)
  window.parent.postMessage({
    type:"keypress",
    ev: {
      keyCode:a.keyCode,
      metaKey:a.metaKey,
    },
  },'*');
}
//arrow keys are only passed in onkeydown
window.onkeydown=function(e) {
  switch(e.keyCode) {
    case 38:
    case 40:
    case 33:
    case 34:
    case 35:
    case 36:
//    default:
      window.parent.postMessage({
      type:"keypress",
      ev: {
        keyCode:e.keyCode,
        metaKey:e.metaKey,
      },
    },'*');
  }
  return true;
}
    </script>
  </head>
  <body>
  <div id="menu">
    <ul>
      <li><a href="#index">Startseite</a></li>
      <li class="loginshow"><a href="#op/addnew">Neuen Feed hinzufügen</a></li>
      <li class="loginshow"><a href="#op/addgr">GoogleReader Import</a></li>
      <li class="logoutshow"><a href="#op/login">Anmelden</a></li>
      <li class="loginshow"><a href="#op/logout">Abmelden</a></li>
      <li class="loginshow"><a href="#op/settings">Einstellungen für <span class="username"></span></a></li>
    </ul>
    <hr />
    <ul id="feedlist">
      <li class="loading">Lade...</li>
      <li class="nofeeds">Keine Feeds vorhanden</li>
    </ul>
    <hr />
    <ul id="debug_extra">
      <li id="flts"></li>
      <li>Pool: <span id="poollen"></span> Items</li>
    </ul>
  </div>
  <div id="content">
    <div class="view" id="oplogin">
      <h1>Anmelden</h1>
      <h2>SkyRSS-Konto</h2>
      <form id="loginform">
      <div id="login-error"></div>
      <table>
        <tr><th>Benutzername</th><td><input type="text" id="login-username" /></td></tr>
        <tr><th>Passwort</th><td><input type="password" id="login-password" /></td></tr>
        <tr><td colspan="2"><button id="login-btn">Anmelden</button></td></tr>
      </table>
      </form>
      <h2>Twitter</h2>
      <a href="lib/twitter.php" id="logintw"></a>
      <h2>Facebook</h2>
      <a href="lib/facebook.php" id="loginfb"></a>
    </div>
    <div class="view" id="oplogout">
      <h1>Abmelden</h1>
      <form id="logoutform">
      <p>Hiermit melden Sie sich von diesem Rechner ab.</p>
      <p><em>Achtung</em>: dieser Schritt löscht sämtliche synchronisierten Elemente von Ihrem Rechner!</p>
      <p><button id="logout-btn">Abmelden</button></p>
      </form>
    </div>
    <div class="view" id="opsettings">
      <h1>Einstellungen</h1>
      
      <h2>Konto</h2>
      <form id="settingsform-account">
      <table>
        <tr><th>Benutzername</th><td><span class="username"></span></td></tr>
        <tr class="passwordrow"><th>Passwort</th><td><input type="password" placeholder="Neues Passwort..." id="setings-password" /></td></tr>
        <tr class="passwordrow"><td colspan="2"><button id="settings-accountbtn-save">Speichern</button></td></tr>
      </table>
      </form>
      
      <h2>Feeds</h2>
      <table id="settings-feeds">
        <thead>
          <tr><th>Feed-ID</th><th>Feed-URL</th><th>Feed-Titel</th><th>Aktion</th></tr>
          <tr class="nofeeds"><td colspan="4">Keine Feeds vorhanden</td></tr>
        </thead>
        <tbody>
        </tbody>
      </table>
      
      <h2>Darstellung</h2>
      
    </div>
    <div class="view" id="opaddnew">
      <h1>Neuen Feed hinzufügen</h1>
      <p>Sie können in die Box die Adresse einer beliebigen Website oder eines RSS/ATOM/RDF-Feeds einfügen, den Rest erledigt SkyRSS</p>
      <p><input id="newfeedurl" size="90" type="url" placeholder="http://example.tld/feed.rss"/> <button id="addnewfeed">Feed hinzufügen</button></p>
      <div id="discover-results">
      <h2>Feeds</h2>
        <table id="discover-feedlist">
          <thead>
            <tr><th>Feed-URL</th><th>Feed-Titel</th><th>Aktion</th></tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    </div>
    <div class="view" id="opaddgr">
      <h1>OPML-/Google-Reader-Import</h1>
      <h2>Datei</h2>
      <input id="grfile" type="file" size="90" /> <button id="importgrfile">Import starten</button>
      <h2>Ergebnisse</h2>
      <div id="grcounter"><span id="grcounter_cur">0</span> von <span id="grcounter_total">0</span> Feeds geladen</div>
      <table id="grresult" border="1">
        <tr class="header"><th>ReqID</th><th>Feed ID</th><th>Feed URL</th><th>Feed Title</th><th>Status</th></tr>
        <tr id="grresult-noentries"><td colspan="5">Keinen Feed geladen</td></tr>
      </table>
    </div>
    <div class="view" id="index">
      Bitte wählen Sie links einen Feed aus...
    </div>
    <div class="view" id="feed">
      <div id="feedbar">
        <a id="feed_href" target="_blank"><h1 id="feed_title"></h1></a>
        <div id="feedmenu">
          <span class="item">Stand: <span id="feed_ts"></span></span>
          <span class="item"><span id="feed_shown"></span>/<span id="feed_total"></span> Einträge</span>
          <span class="item"><button id="feed_reload">Neu laden</button></span>
          <span class="item"><button id="feed_update">Von Server laden</button></span>
          <span class="item"><button id="feed_allread">Alle als gelesen markieren</button></span>
          <span class="item">
            <select id="feed_sort">
              <option value="desc">Neueste zuerst</option>
              <option value="asc">Älteste zuerst</option>
            </select>
          </span>
          <span class="item">
            <input id="feed_showread" checked="checked" type="checkbox"/> <label for="feed_showread">Gelesene Elemente anzeigen</label>
          </span>
        </div>
      </div>
      <ul id="feedentries">
        <li id="feedmore">
          <span class="more">Mehr Einträge</span>
          <span class="loading">Lade...</span>
          <span class="nomore">Keine weiteren Einträge vorhanden</span>
        </li>
      </ul>
    </div>
  </div>  
  <div id="share-container">
    <div id="share-content">
      <div id="share-close">
      X
      </div>
      <h2>Twitter</h2>
      <a id="share-twitter" href="" target="_blank">
        Auf Twitter teilen
      </a>
      <h2>Facebook</h2>
      <a id="share-fb" href="" target="_blank">
        Auf Facebook teilen
      </a>
    </div>
  </div>
  </body>
</html>