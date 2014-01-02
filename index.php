<?
require("config.php");
if(strtolower($_SERVER["SERVER_NAME"])!=$config["url"]["host"]) {
  header("HTTP/1.1 301 Moved Permanently");
  header("Location: ".$config["url"]["defaultscheme"]."://".$config["url"]["host"]);
  exit(0);
}
?><!doctype html>
<html manifest="manifest.php">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=0,width=320.1" />
    <meta name="google" value="notranslate" />
<?
if(isset($_GET["debug"]) && $config["debugurl"]!="")
  echo '<script src="'.$config["debugurl"].'"></script>';
?>
    
    <title><?= $config["site"]["name"] ?></title>
    <link rel="stylesheet" href="css/app.css" type="text/css" media="all" />
    <link rel="stylesheet" href="css/jquery-ui-1.10.3.custom.css" type="text/css" media="all" />
    
    <script type="text/javascript" src="js/console.js"></script>
    
    <!-- web app -->
    <meta name="apple-mobile-web-app-capable" content="yes" /><!-- Crapple iOS -->
    <meta name="mobile-web-app-capable" content="yes"><!-- Chrome on Android -->
    <link rel="shortcut icon" sizes="196x196" href="assets/readme_196.png"> <!-- standard -->
    <link rel="apple-touch-icon" sizes="196x196" href="assets/readme_196.png"> <!-- Fapple iOS -->
    <!-- <link rel="apple-touch-icon-precomposed" sizes="128x128" href=".png"> -->

    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-title" content="<?= $config["site"]["name"] ?>">
    
    <!-- jquery and plugins -->
    <script type="text/javascript" src="js/modernizr.js"></script>
    <script type="text/javascript" src="js/jquery-2.0.3.js"></script>
    <script type="text/javascript" src="js/jquery-migrate-1.2.1.js"></script>
    <!-- load this ASAP -->
    <script type="text/javascript" src="js/component.offline.js"></script>
    <script type="text/javascript" src="js/jquery.ba-hashchange.min.js"></script>
    <script type="text/javascript" src="js/jquery.disableSelection.js"></script>
    <script type="text/javascript" src="js/date.format.js"></script>
    <script type="text/javascript" src="js/jquery.scrollTo-min.js"></script>
    <script type="text/javascript" src="js/jquery.jqote2.min.js"></script>
    <script type="text/javascript" src="js/jquery.toggleCheckbox.js"></script>
    <script type="text/javascript" src="js/jquery.dropdown.js"></script>
    <script type="text/javascript" src="js/jquery.alterclass.js"></script>
    <script type="text/javascript" src="js/jquery.dataselector.js"></script>
    <script type="text/javascript" src="js/jquery-ui-1.10.3.custom.js"></script>
    <script type="text/javascript" src="js/IndexedDBShim/dist/IndexedDBShim.js"></script>
    <script type="text/javascript" src="js/jquery-indexeddb/dist/jquery.indexeddb.js"></script>
    <script type="text/javascript" src="js/rusha.js/rusha.js"></script>
    
    <!-- application components -->
    <script type="text/javascript" src="js/component.network.js"></script>
    <script type="text/javascript" src="js/component.session.js"></script>
    <script type="text/javascript" src="js/component.settings.js"></script>
    <script type="text/javascript" src="js/component.login.js"></script>
    <script type="text/javascript" src="js/component.logout.js"></script>
    <script type="text/javascript" src="js/component.createaccount.js"></script>
    <script type="text/javascript" src="js/component.feedlist.js"></script>
    <script type="text/javascript" src="js/component.nav.js"></script>
    <script type="text/javascript" src="js/component.mobify.js"></script>
    <script type="text/javascript" src="js/component.browserbark.js"></script>
    <script type="text/javascript" src="js/component.feed.js"></script>
    <script type="text/javascript" src="js/component.feedicons.js"></script>
    <script type="text/javascript" src="js/view.menu.js"></script>
    <script type="text/javascript" src="js/view.index.js"></script>
    <script type="text/javascript" src="js/view.login.js"></script>
    <script type="text/javascript" src="js/view.logout.js"></script>
    <script type="text/javascript" src="js/view.welcome.js"></script>
    <script type="text/javascript" src="js/view.settings.js"></script>
    <script type="text/javascript" src="js/view.library.js"></script>
    <script type="text/javascript" src="js/view.feed.js"></script>
    <script type="text/javascript" src="js/view.feed_keypress.js"></script>
    <script type="text/javascript" src="js/view.modal.js"></script>
    
    <script type="text/javascript" src="config.js"></script>
    <script type="text/javascript" src="js/i18n.js"></script>
    <script type="text/javascript" src="i18n/de.js"></script>
    <script type="text/javascript" src="i18n/en.js"></script>
    <script type="text/javascript" src="js/api.js"></script>
    <script type="text/javascript" src="js/importgr.js"></script>
    <script type="text/javascript" src="js/app.js"></script>
    <script type="text/javascript" src="js/tab.js"></script>
    <script type="text/javascript" src="js/polyfill.js/srcdoc-polyfill.js"></script>
    
    <script type="text/javascript" src="js/sprintf.js/src/sprintf.js"></script>

    <!-- jqote template for a news item -->
    <script type="text/html" id="tpl-newsitem">
<![CDATA[
    <div class="news">
      <h3 class="title"><%= this.title %></h3>
      <div class="content"><%= this.text %></div>
    </div>
]]>
    </script>
    
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
    <div><a class="fullLink" target="_blank" href="<%! this.href %>"><%= _("page_openlink") %></a></div>
    <div class="author"><%! this.author %></div>
    <div class="fullText"></div>
  </div>
  <table class="bottomRow">
    <tr>
      <td><input type="checkbox" class="itemRead" id="itemread-<%= this.id %>"/> <label for="itemread-<%= this.id %>"><%= _("page_markasread") %></label></td>
      <td class="share"><%= _("page_share") %></td>
    </tr>
  </table>
</li>
]]>
    </script>
    
    <!-- jqote template for a feed list entry -->
    <script type="text/html" id="tpl-feedlist">
<![CDATA[
<li class="<%= this.liclass %>" title="<%! this.desc %>">
<% if(this.icon!="") { %>
  <img src="<%! this.icon %>" class="icon" />
<% } %>
  <a><%! this.title %></a>
  <span class="unread_count"><%= this.unread %></span>
</li>
]]>
    </script>

    <!-- jqote template for a library block -->
    <script type="text/html" id="tpl-libblock">
<![CDATA[
<div class="libblock">
  <h2><%! this.title %></h2>
  <table>
  </table>
</div>
]]>
    </script>

    <!-- jqote template for a library entry -->
    <script type="text/html" id="tpl-libentry">
<![CDATA[
<tr>
  <td><span title="<%! this.desc %>"><%! this.title %></td></td>
  <td><button class="i18n addfeed" data-key="page_add"></button></td>
  <td><button class="i18n preview" data-key="page_preview"></button></td>
</tr>
]]>
    </script>    
    
    <!-- jqote template for a snack block -->
    <script type="text/html" id="tpl-snackblock">
<![CDATA[
      <div class="feed">
        <h3 title="<%! this.desc %>"><%! this.title %> <span class="unread">(<%= this.unread %>)</span></h3>
        <div class="content"></div>
      </div>
]]>
    </script>
    
    <!-- jqote template for a snack item -->
    <script type="text/html" id="tpl-snackitem">
<![CDATA[
      <div class="item">
        <h4><%! this.title %></h4>
        <div class="text"><%! this.excerpt %></div>
      </div>
]]>
    </script>
    
    
    <!-- jqote template for a settings feed line -->
    <script type="text/html" id="tpl-settings-feed">
<![CDATA[
      <tr class="feed">
        <td class="icon">
        <% if(this.icon!="") { %>
          <img src="<%! this.icon %>" class="icon" />
        <% } %>
        </td>
        <td class="theid"><%= this.id %></td>
        <td><a href="<%! this.link %>" target="_blank"><%! this.link %></a></td>
        <td><%! this.title %></td>
        <td><button class="del"><%= _("page_delete") %></button></td>
        <td><%= this.order %></td>
      </tr>
]]>
    </script>
    
    <!-- jqote template for a settings directory line -->
    <script type="text/html" id="tpl-settings-dir">
<![CDATA[
      <tr class="dir">
        <td class="icon">
          <% if(this.icon!="") { %>
            <img src="<%! this.icon %>" class="icon" />
          <% } %>
        </td>
        <td colspan="4"><%! this.title %></td>
        <td><%= this.order %></td>
      </td>
]]>
    </script>
    
    
    <script type="text/plain" id="inject-height">
// This script gets injected into the content iframes.
// It tells the parent its inner height so that the iframe can be exactly fit
// and also tells the parent key presses to allow space-scrolling.
// This is not possible from outside because of same-origin policy.
var skyrss_timer_id=-1;
function seth() {
  //tell parent our height
  window.parent.postMessage({
    type:"seth",
    scrollHeight:document.body.scrollHeight,
    myId:theId,
  },'*');
  if(skyrss_timer_id==-1) {
    skyrss_timer_id=setInterval(seth,500);
  }
}
//Fire on onLoad as well as on DOMReady, so that the text can be read, even if not all images are loaded
//This is especially needed on mobile and other slow links
window.onload=function() {
  seth();
  clearInterval(skyrss_timer_id);
  var links=document.getElementsByTagName("a");
  for(var i=0;i<links.length;i++) {
    var link=links[i];
    if(link.href)
      link.target="_new";
  }
};
document.addEventListener('DOMContentLoaded',seth);

window.addEventListener("message",function(e) {
  if(!event.data.type)
    return;
  if(event.data.type=="geth") {
    console.log("got a height request");
    seth();
  }
});

window.onkeypress=function(a) {
  window.parent.postMessage({
    type:"keypress",
    ev: {
      keyCode:a.keyCode,
      metaKey:a.metaKey,
    },
  },'*');
}
window.onkeydown=function(e) {
  window.parent.postMessage({
    type:"keydown",
    ev: {
      keyCode:e.keyCode,
      metaKey:e.metaKey,
    },
  },'*');
}
    </script>
  </head>
  <body>
  <div id="offline-box" class="i18n" data-key="page_offline"></div>
  <div id="menu">
    <ul>
      <li class="groupheader"><a href="#index" class="i18n" data-key="page_home"></a></li>
      <li class="groupheader loginshow i18n" data-key="page_headeradd"></li>
      <li class="loginshow groupitem connectedshow"><a href="#addnew"><span class="i18n" data-key="page_addfeed"></span></a></li>
      <li class="loginshow groupitem connectedshow"><a href="#addgr"><span class="i18n" data-key="page_addgr"></span></a></li>
      <li class="loginshow groupitem"><a href="#library"><span class="i18n" data-key="page_library"></span></a></li>
      <li class="groupheader i18n connectedshow" data-key="page_headeraccount"></li>
      <li class="logoutshow groupitem connectedshow"><a href="#login"><span class="i18n" data-key="page_login"></span></a></li>
      <li class="loginshow groupitem connectedshow"><a href="#logout"><span class="i18n" data-key="page_logout"></span></a></li>
      <li class="loginshow groupitem connectedshow"><a href="#settings"><span class="i18n" data-key="page_settingsfor"></span><span class="username"></span></a></li>
      <li class="groupheader i18n" data-key="page_headerhelp"></li>
      <li class="groupitem"><a href="#welcome"><span class="i18n" data-key="page_firststeps"></span></a></li>
    </ul>
    <hr />
    <ul id="feedlist">
      <li class="loading"><span class="i18n" data-key="page_loading"></span></li>
      <li class="nofeeds"><span class="i18n" data-key="page_nofeeds"></span></li>
    </ul>
    <hr />
    <ul id="debug_extra">
      <li id="flts"></li>
      <li id="poolinfo">Pool: <span id="poollen"></span> Items</li>
    </ul>
  </div>
  <div id="content">
    <div class="view" id="oplogin">
      <h1><span class="i18n" data-key="page_login"></span></h1>
      <div class="tabcontainer_group tabgroup-login">
        <div class="tabcontainer tab-skyrssaccount">
          <h2 class="tabheader tabgroup-login tab-skyrssaccount"><span style="display:none" class="i18n" data-key="page_skyrssaccount"></span></h2>
          <div class="tab tab-skyrssaccount active">
            <form id="loginform">
            <div id="login-error"></div>
            <table>
              <tr><th><span class="i18n" data-key="page_username"></span></th><td><input type="text" id="login-username" /></td></tr>
              <tr><th><span class="i18n" data-key="page_password"></span></th><td><input type="password" id="login-password" /></td></tr>
              <tr><td colspan="2"><button id="login-btn"><span class="i18n" data-key="page_login"></span></button></td></tr>
              <tr><td colspan="2" id="login-captcha"></td></tr>
              <tr><td colspan="2"><button id="createaccount-btn"><span class="i18n" data-key="page_createaccount"></span></button></td></tr>
            </table>
            </form>
          </div>
        </div>
        <div class="tabcontainer tab-twitteraccount">
          <h2 class="tabheader tab-twitteraccount tabgroup-login">Twitter</h2>
          <div class="tab tab-twitteraccount">
            <a href="lib/twitter.php" id="logintw"></a>
          </div>
        </div>
        <div class="tabcontainer tab-facebookaccount">
          <h2 class="tabheader tab-facebookaccount tabgroup-login">Facebook</h2>
          <div class="tab tab-facebookaccount">
            <a href="lib/facebook.php" id="loginfb"></a>
          </div>
        </div>
      </div>
    </div>
    <div class="view" id="oplogout">
      <h1><span class="i18n" data-key="page_logout"></span></h1>
      <form id="logoutform">
      <p><span class="i18n" data-key="page_logoutconfirm"></span></p>
      <p><em><span class="i18n" data-key="page_warning"></span></em>: <span class="i18n" data-key="page_logoutwarning"></span></p>
      <p><button id="logout-btn"><span class="i18n" data-key="page_logout"></span></button></p>
      </form>
    </div>
    <div class="view" id="opsettings">
      <h1><span class="i18n" data-key="page_settings"></span></h1>
      <div class="tabcontainer_group tabgroup-settings">
        <div class="tabcontainer tab-account">
          <h2 class="tabheader tab-account tabgroup-settings"><span class="i18n" data-key="page_account"></span></h2>
          <div class="tab tab-account">
            <form id="settingsform-account">
            <table>
              <tr><th><span class="i18n" data-key="page_username"></span></th><td><span class="username"></span></td></tr>
              <tr class="passwordrow"><th><span class="i18n" data-key="page_password"></span></th><td><input type="password" placeholder="Neues Passwort..." id="setings-password" /></td></tr>
              <tr class="passwordrow"><td colspan="2"><button id="settings-accountbtn-save"><span class="i18n" data-key="page_save"></span></button></td></tr>
            </table>
            </form>
          </div>
        </div>
        <div class="tabcontainer tab-feeds">
          <h2 class="tabheader tab-feeds tabgroup-settings"><span class="i18n" data-key="page_feeds"></span></h2>
          <div class="tab tab-feeds active">
            <table id="settings-feeds">
              <thead>
                <tr><th></th><th><span class="i18n" data-key="page_feedid"></span></th><th><span class="i18n" data-key="page_feedurl"></span></th><th><span class="i18n" data-key="page_feedtitle"></span></th><th><span class="i18n" data-key="page_action"></span></th><th>OID</th></tr>
                <tr class="nofeeds"><td colspan="5"><span class="i18n" data-key="page_nofeeds"></span></td></tr>
                <tr class="ddhelper"><td></td><td colspan="5" class="h"></td></tr>
              </thead>
              <tbody>
              </tbody>
            </table>
          </div>
        </div>
        <div class="tabcontainer tab-display">
          <h2 class="tabheader tab-display tabgroup-settings"><span class="i18n" data-key="page_displaysettings"></span></h2>
          <div class="tab tab-display">
            <form id="settingsform-display">
            <table>
              <tr><th class="i18n" data-key="page_jumponopen"></th><td><input type="checkbox" id="settings-display-jumponopen" data-key="jumponopen" /></td></tr>
              <tr><th class="i18n" data-key="page_infinitescroll"></th><td><input type="checkbox" id="settings-display-infinitescroll" data-key="infinitescroll" /></td></tr>
              <tr><th class="i18n" data-key="page_language"></th><td><select id="settings-display-language" data-key="language"></select></td></tr>
              <tr><th class="i18n" data-key="page_font"></th><td><select id="settings-display-font" data-key="font"></select></td></tr>
              <tr><th class="i18n" data-key="page_showsnacks"></th><td><input type="checkbox" id="settings-display-showsnacks" data-key="showsnacks" /></td></tr>
              <tr><td colspan="2"><button id="settings-display-save"><span class="i18n" data-key="page_save"></span></button></td></tr>
            </table>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="view" id="opaddnew">
      <h1><span class="i18n" data-key="page_addfeed"></span></h1>
      <p><span class="i18n" data-key="page_addnewintro"></span></p>
      <p><form><input id="newfeedurl" size="90" type="url" placeholder="http://example.tld/feed.rss"/> <button id="addnewfeed"><span class="i18n" data-key="page_detectfeeds"></span></button></form></p>
      <div id="discover-results">
      <h2><span class="i18n" data-key="page_feeds"></span></h2>
        <table id="discover-feedlist">
          <thead>
            <tr><th><span class="i18n" data-key="page_feedurl"></span></th><th><span class="i18n" data-key="page_feedtitle"></span></th><th><span class="i18n" data-key="page_action"></span></th></tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    </div>
    <div class="view" id="opaddgr">
      <h1><span class="i18n" data-key="page_addgr"></span></h1>
      <h2><span class="i18n" data-key="page_file"></span></h2>
      <input id="grfile" type="file" size="90" /> <button id="importgrfile"><span class="i18n" data-key="page_startimport"></span></button>
      <h2><span class="i18n" data-key="page_results"></span></h2>
      <div id="grcounter"><span id="grcounter_cur">0</span> von <span id="grcounter_total">0</span> Feeds geladen</div>
      <table id="grresult" border="1">
        <tr class="header"><th><span class="i18n" data-key="page_requestid"></span></th><th><span class="i18n" data-key="page_feedid"></span></th><th><span class="i18n" data-key="page_feedurl"></span></th><th><span class="i18n" data-key="page_feedtitle"></span></th><th><span class="i18n" data-key="page_status"></span></th></tr>
        <tr id="grresult-noentries"><td colspan="5"><span class="i18n" data-key="page_nofeeds"></span></td></tr>
      </table>
    </div>
    <div class="view" id="library">
      <h1><span class="i18n" data-key="page_library"></span></h1>
      <div id="library-content">
      </div>
    </div>
    <div class="view" id="index">
      <h1><?= $config["site"]["name"] ?></h1>
      <p><span class="i18n" data-key="page_startsite"></span></p>
      <h2 class="i18n" data-key="page_mostrecent"></h2>
      <div id="index-mostrecent"></div>
      <div id="index-mostrecent-status"></div>
      <h2><span class="i18n" data-key="page_news"></span></h2>
      <div id="index-news"></div>
      <div id="index-news-status"></div>
    </div>
    <div class="view" id="feed">
      <div id="feedbar">
        <a id="feed_href" target="_blank"><h1 id="feed_title"></h1></a>
        <div id="feedmenu">
          <span class="item"><span id="feed_shown"></span>/<span id="feed_total"></span> <span class="i18n" data-key="page_entries"></span></span>
          <span class="item"><div id="feed_allread" class="i18n feedbarbtn" data-key="page_markallasread"></div></span>
          <span class="item"><div id="feed_addfrompreview" class="i18n feedbarbtn" data-key="page_add"></div></span>
          <span class="item">
          <div class="dropdown-container feedbarbtn">
            <div class="dropdown-header"><span class="i18n" data-key="page_feedoptions"></span><span class="dropdown-arrow"></span></div>
            <div class="dropdown-items">
              <div class="dropdown-item i18n" data-key="page_reload" id="feed_reload"></div>
              <div class="dropdown-item i18n" data-key="page_reloadserver" id="feed_update"></div>
              <div class="dropdown-item i18n" data-key="page_unsubscribe" id="feed_unsubscribe"></div>
              <div class="dropdown-item i18n" data-key="page_feedsettings" id="feed_opensettings"></div>
            </div>
          </div>
          </span>
          <span class="item">
          <div class="dropdown-container feedbarbtn">
            <div class="dropdown-header"><span class="i18n" data-key="page_feeddisplay"></span><span class="dropdown-arrow"></span></div>
            <div class="dropdown-items">
              <div class="dropdown-item">
                <input id="feed_showread" checked="checked" type="checkbox"/> <label for="feed_showread"><span class="i18n" data-key="page_showread"></span></label>
              </div>
              <div class="dropdown-item">
                <select id="feed_sort">
                  <option value="desc" class="i18n" data-key="page_newestfirst"></option>
                  <option value="asc" class="i18n" data-key="page_oldestfirst"></option>
                </select>
              </div>
            </div>
          </div>
          </span>
        </div>
      </div>
      <ul id="feedentries">
        <li id="feedmore">
          <span class="more"><span class="i18n" data-key="page_more"></span></span>
          <span class="loading"><span class="i18n" data-key="page_loading"></span></span>
          <span class="nomore"><span class="i18n" data-key="page_nomore"></span></span>
        </li>
      </ul>
      <div id="feedfooter">
        <span class="item"><span class="i18n" data-key="page_ts"></span>: <span id="feed_ts"></span></span>
      </div>
    </div>
    <div class="view" id="welcome">
      <h1 class="i18n" data-key="page_welcome"></h1>
      <h2 class="i18n" data-key="page_firststeps"></h2>
      <img src="assets/reader_feedview.png" style="width:500px" /><br />
      <ol id="welcome_firststeps">
        <li class="i18n" data-key="page_firststeps_1"></li>
        <li class="i18n" data-key="page_firststeps_2"></li>
        <li class="i18n" data-key="page_firststeps_3"></li>
        <li class="i18n" data-key="page_firststeps_4"></li>
        <li class="i18n" data-key="page_firststeps_5"></li>
        <li class="i18n" data-key="page_firststeps_6"></li>
      </ol>
    </div>  
    <div id="mobile_menu"><a href="#menu">Menü</a></div>
  </div>
  <div id="modal-container">
    <div id="share-content" class="modal-box">
      <div id="share-close" class="modal-close">
      X
      </div>
      <h2>Twitter</h2>
      <a id="share-twitter" href="" target="_blank">
        <span class="i18n" data-key="page_shareontwitter"></span>
      </a>
      <h2>Facebook</h2>
      <a id="share-fb" href="" target="_blank">
        <span class="i18n" data-key="page_shareonfb"></span>
      </a>
    </div>
    <div id="ie-warning" class="modal-box">
      <h2 class="i18n" data-key="page_error"></h2>
      <span class="i18n" data-key="page_noie"></span>
    </div>
    <div id="safariwin-warning" class="modal-box">
      <h2 class="i18n" data-key="page_error"></h2>
      <span class="i18n" data-key="page_nosafariwin"></span>
    </div>
    <div id="manifest-progress" class="modal-box">
      <h2 class="i18n" data-key="page_loading"></h2>
      <span id="manifest-label"></span>
    </div>
  </div>
  </body>
</html>
