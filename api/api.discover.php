<?
function resolveRelativeUrl($base,$url) {
  $p=parse_url($base);
  if(parse_url($url,PHP_URL_SCHEME)!="") //is already fully-qualified!
    return $url; 
  
  //backup auth data from base
  $auth="";
  if(isset($p["user"]))
    $auth=$p["user"];
  if(isset($p["pass"]))
    $auth.=":".$p["pass"];
  if($auth!="")
    $auth.="@";
  //backup port from base
  $port="";
  if(isset($p["port"]))
    $port=":".$p["port"];
  if(substr($url,0,1)=="/") //relative to site URL
    return sprintf("%s://%s%s%s%s",$p["scheme"],$auth,$p["host"],$port,$url);
  
  //now, try to check if the path is a directory
  if(substr($p["path"],-1,1)=="/") //directory
    return sprintf("%s://%s%s%s%s%s",$p["scheme"],$auth,$p["host"],$port,$p["path"],$url);
  
  //strip the last filename-component off the path
  $p["path"]=substr($p["path"],0,strrpos($p["path"],"/"));
    return sprintf("%s://%s%s%s%s/%s",$p["scheme"],$auth,$p["host"],$port,$p["path"],$url);
}

$url=$_GET["url"];

try {
  $raw=CURL::get($url);
} catch(CURLDownloadException $e) {
  throw new FileLoadException("Feed get failed: ".$e->getMessage());
} catch(PermissionDeniedException $e) {
  try {
    $scheme=parse_url($url,PHP_URL_SCHEME);
    if($scheme=="")
      $url="http://$url";
    $raw=CURL::get($url);
  } catch(Exception $e2) {
    throw new FileLoadException("Feed get #2 failed");
  }
}

//avoid stupid warnings caused by invalid HTML
libxml_use_internal_errors(true);
//First, try to load as XML (strict)
$doc = new DomDocumentCharset();
$rv=$doc->loadXML($raw);
if($rv===false) {
  $doc=new DOMDocumentCharset();
  $rv=$doc->loadHTMLCharset($raw);
  if($rv===false)
    throw new WrongFormatException("XML load failed");
}
libxml_use_internal_errors(false);

if(strtolower($doc->documentElement->tagName=="html")) {
  //get all link elements conforming to http://www.rssboard.org/rss-autodiscovery
  $xpath=new DOMXPath($doc);
  
  $res=$xpath->evaluate('//link[@type="application/rss+xml" or @type="application/atom+xml"][@rel="alternate"]');
  $ret["feeds"]=array();
  for($i=0;$i<$res->length;$i++) {
    $item=$res->item($i);
    if(!$item->hasAttribute("href"))
      continue;
    $title="";
    if($item->hasAttribute("title"))
      $title=$item->getAttribute("title");
    $ret["feeds"][]=array("link"=>resolveRelativeUrl($url,$item->getAttribute("href")),"title"=>$title);
  }
} elseif(strtolower($doc->documentElement->tagName=="rss")) {
  $feed=Feed::createFromText($url,$raw);
  $ret["feeds"][]=array("link"=>$url,"title"=>$feed->title);
} else {
  throw new WrongFormatException("Expected HTML, got ".$doc->documentElement->tagName);
}

