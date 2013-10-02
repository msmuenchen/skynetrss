<?
//Feed abstractor classes

//Utility function: try to parse a timestamp...
//and throw a MalformedFeedException if it's not parsable
function parseTimestamp($ts) {
  $formats=array(
    DateTime::RFC1123, //RFC 1123 D, d M Y H:i:s O
    DateTime::RFC3339, //RFC 3339 Y-m-d\TH:i:sP
    "Y-m-d\TH:i:s.uP", //RFC 3339 with microseconds
    DateTime::RFC822,  //RFC 822  D, d M y H:i:s O
    "d M Y H:i:s O",   //RFC 1123 without text day name (taz.de)
  );
  $ts=trim($ts);
  foreach($formats as $format) {
    $d=DateTime::createFromFormat($format,$ts);
    if($d!==false)
      return $d->getTimestamp();
  }
  throw new MalformedFeedException("Failed to parse timestamp $ts");
}

class FeedItem {
  public $guid;
  public $title;
  public $time;
  public $link;
  public $text;
  public $author;
}

class Feed {
  //feed xml tree
  public $tree;
  
  //feed xml url
  public $url;
  //website
  public $link;
  //feed title
  public $title;
  //subtitle/description
  public $desc;
  //TTL
  public $ttl;
  //Feed icon
  public $icon;
  
  //Items
  public $items=array();
  
  public static function createFromText($url,$content) {
    //parse xml
    libxml_use_internal_errors(true);
    $tree=simplexml_load_string($content,"SimpleXMLElement",LIBXML_NOCDATA);
    if($tree===false) {
      $estr="XML-Fehler im Feed $url:<br /><pre>";
      foreach (libxml_get_errors() as $error) {
        $estr.=print_r($error,true);
      }
      libxml_clear_errors();
      $estr.="</pre>";
      throw new XMLParseException($estr);
    }
    switch(strtolower($tree->getName())) {
      case "rss":
        return new RSSFeed($url,$tree);
      case "rdf":
        return new RDFFeed($url,$tree);
      case "feed":
        return new AtomFeed($url,$tree);
      default:
        throw new WrongFormatException("Unknown type ".$tree->getName());
    }
  }
  
  public static function createFromUrl($url) {
    //get content
    try {
      $content=CURL::get($url);
    } catch(CURLDownloadException $e) {
      throw new FileLoadException("Fehler beim Laden des Feeds $url");
    }    
    return static::createFromText($url,$content);
  }
}
class AtomFeed extends Feed {
  public function __construct($url,$tree) {
    $this->tree=$tree;
    if(strtolower($tree->getName())!="feed") {
      throw new WrongFormatException("Expected Atom feed, got a ".$tree->getName()." feed");
    }
    $namespaces=$tree->getNamespaces(true);
    
    if(!property_exists($tree,"entry"))
      throw new MalformedFeedException("Atom-Fehler: Keine ENTRY-Elemente im TREE");
    if(!property_exists($tree,"title"))
      throw new MalformedFeedException("Atom-Fehler: Kein TITLE-Element im CHANNEL");
    if(!property_exists($tree,"id"))
      throw new MalformedFeedException("Atom-Fehler: Kein ID-Element im CHANNEL");
    
    if($tree->title=="")
      $tree->title=$url;
    
    if(property_exists($tree,"subtitle"))
      $this->desc=(string)$tree->subtitle;
    else
      $this->desc="";
    
    $this->url=$url;
    $this->link=(string)$tree->id;
    $this->title=(string)$tree->title;
    $this->ttl=15;
    $this->icon="";
    
    foreach($tree->entry as $index=>$item) {
      $itemObj=new FeedItem();
      
      //Try to get a GUID. If there was none supplied, hash the title, and then hash the description.
      if(property_exists($item,"id")) {
        $guid=$item->id;
      } elseif(property_exists($item,"title")) {
        $guid=md5($item->title);
      } elseif(property_exists($item,"summary")) {
        $guid=md5($item->summary);
      } elseif(property_exists($item,"content")) {
        $guid=md5($item->content);
      } else {
        throw new MalformedFeedException("Item $index does not have GUID, TITLE or DESCRIPTION!");
      }
      
      //Try to get a title. Either one is supplied or use the first 20 chars of the description
      if(property_exists($item,"title")) {
        $title=$item->title;
      } elseif(property_exists($item,"summary")) {
        $title=mb_substr($item->description,0,20,"UTF-8")."...";
      } elseif(property_exists($item,"content")) {
        $title=mb_substr($item->content,0,20,"UTF-8")."...";
      } else {
        throw new MalformedFeedException("Item $index does not have TITLE or DESCRIPTION");
      }
      
      //Try to get fulltext. Take content, description or the title as last resort
      //This is disabled, it doesnt work -...-
    /*    if(false && property_exists($item,"content")) {
        $content=$item->content;
      } else */
      if(property_exists($item,"content")) {
        $content=$item->content;
      } elseif(property_exists($item,"summary")) {
        $content=$item->summary;
      } else {
        $content=$title;
      }
      
      //Try to get the link
      $link="";
      if(property_exists($item,"link")) {
        foreach($item->link as $l) {
          $attrs=$l->attributes();
          if(!property_exists($attrs,"rel"))
            continue;
          if($attrs->rel!="alternate")
            continue;
          if(!property_exists($attrs,"href"))
            continue;
          $link=$attrs->href;
          break;
        }
      }
      
      //Try to get date
      if(property_exists($item,"updated")) {
        $val=$item->updated;
        $d=parseTimestamp($val);
      } else {
        $d=time();
      }
      $itemObj->guid=(string)$guid;
      $itemObj->title=(string)$title;
      $itemObj->time=(int)$d;
      $itemObj->link=(string)$link;
      $itemObj->text=(string)$content;
      $itemObj->author="";
      $this->items[]=$itemObj;
    }
  }
}
class RDFFeed extends Feed {
  public function __construct($url,$tree) {
    $this->tree=$tree;
    if(strtolower($tree->getName())!="rdf") {
      throw new WrongFormatException("Expected RDF feed, got a ".$tree->getName()." feed");
    }
    if(!property_exists($tree,"channel"))
      throw new MalformedFeedException("RDF-Fehler: CHANNEL-Element nicht vorhanden");
    
    $namespaces=$tree->getNamespaces(true);
    
    $channel=$tree->channel;
    if(!property_exists($tree,"item"))
      throw new MalformedFeedException("RDF-Fehler: Keine ITEM-Elemente im TREE");
    if(!property_exists($channel,"title"))
      throw new MalformedFeedException("RDF-Fehler: Kein TITLE-Element im CHANNEL");
    if(!property_exists($channel,"description"))
      throw new MalformedFeedException("RDF-Fehler: Kein DESCRIPTION-Element im CHANNEL");
    if(!property_exists($channel,"link"))
      throw new MalformedFeedException("RDF-Fehler: Kein LINK-Element im CHANNEL");
    
    if($channel->title=="")
      $channel->title=$url;
    
    $this->url=$url;
    $this->link=(string)$channel->link;
    $this->title=(string)$channel->title;
    $this->desc=(string)$channel->description;
    $this->ttl=15;
    $this->icon="";
    
    foreach($tree->item as $index=>$item) {
      $itemObj=new FeedItem();
      
      //Try to get a GUID. If there was none supplied, hash the title, and then hash the description.
      if(property_exists($item,"link")) {
        $guid=$item->link;
      } elseif(property_exists($item,"title")) {
        $guid=md5($item->title);
      } elseif(property_exists($item,"description")) {
        $guid=md5($item->description);
      } else {
        throw new MalformedFeedException("Item $index does not have GUID, TITLE or DESCRIPTION!");
      }
      
      //Try to get a title. Either one is supplied or use the first 20 chars of the description
      if(property_exists($item,"title")) {
        $title=$item->title;
      } elseif(property_exists($item,"description")) {
        $title=mb_substr($item->description,0,20,"UTF-8")."...";
      } else {
        throw new MalformedFeedException("Item $index does not have TITLE or DESCRIPTION");
      }
      
      //Try to get fulltext. Take content, description or the title as last resort
      //This is disabled, it doesnt work -...-
    /*    if(false && property_exists($item,"content")) {
        $content=$item->content;
      } else */
      if(isset($namespaces["content"]) && property_exists($item->children($namespaces["content"]),"encoded")) {
        $content=$item->children($namespaces["content"])->encoded;
      } elseif(property_exists($item,"description")) {
        $content=$item->description;
      } else {
        $content=$title;
      }
      
      //Try to get the link
      if(property_exists($item,"link")) {
        $link=$item->link;
      } else {
        $link="";
      }
      
      //Try to get date
      if(isset($namespaces["dc"]) && property_exists($item->children($namespaces["dc"]),"date")) {
        $val=$item->children($namespaces["dc"])->date;
        $d=parseTimestamp($val);
      } else {
        $d=time();
      }
      $itemObj->guid=(string)$guid;
      $itemObj->title=(string)$title;
      $itemObj->time=(int)$d;
      $itemObj->link=(string)$link;
      $itemObj->text=(string)$content;
      $itemObj->author="";
      $this->items[]=$itemObj;
    }
  }
}
class RSSFeed extends Feed {
  public function __construct($url,$tree) {
    $this->tree=$tree;
    if(strtolower($tree->getName())!="rss") {
      throw new WrongFormatException("Expected RSS feed, got a ".$tree->getName()." feed");
    }
    if(!property_exists($tree->attributes(),"version"))
      throw new MalformedFeedException("RSS-Fehler: RSS VERSION-Attribut nicht angegeben");
    
    if($tree->attributes()->version!="2.0")
      throw new MalformedFeedException("RSS-Fehler: VERSION != 2.0 (ist: ".$tree->attributes->version.")");
    
    if(!property_exists($tree,"channel"))
      throw new MalformedFeedException("RSS-Fehler: CHANNEL-Element nicht vorhanden");
    
    $namespaces=$tree->getNamespaces(true);
    
    $channel=$tree->channel;
    if(!property_exists($channel,"item"))
      throw new MalformedFeedException("RSS-Fehler: Keine ITEM-Elemente im CHANNEL");
    if(!property_exists($channel,"title"))
      throw new MalformedFeedException("RSS-Fehler: Kein TITLE-Element im CHANNEL");
    if(!property_exists($channel,"description"))
      throw new MalformedFeedException("RSS-Fehler: Kein DESCRIPTION-Element im CHANNEL");
    if(!property_exists($channel,"link"))
      throw new MalformedFeedException("RSS-Fehler: Kein LINK-Element im CHANNEL");
    if(property_exists($channel,"ttl"))
      $ttl=(int)$channel->ttl;
    else
      $ttl=15;

    if(property_exists($channel,"image") && property_exists($channel->image,"url"))
      $icon=$channel->image->url;
    else
      $icon="";

    if($channel->title=="")
      $channel->title=$url;
    
    $this->url=$url;
    $this->link=(string)$channel->link;
    $this->title=(string)$channel->title;
    $this->desc=(string)$channel->description;
    $this->ttl=$ttl;
    $this->icon=(string)$icon;
    
    foreach($channel->item as $index=>$item) {
      $itemObj=new FeedItem();
      
      //Try to get a GUID. If there was none supplied, hash the title, and then hash the description.
      if(property_exists($item,"guid") && $item->guid!="") {
        $guid=$item->guid;
      } elseif(property_exists($item,"title")) {
        $guid=md5($item->title);
      } elseif(property_exists($item,"description")) {
        $guid=md5($item->description);
      } else {
        throw new MalformedFeedException("Item $index does not have GUID, TITLE or DESCRIPTION!");
      }
      
      //Try to get a title. Either one is supplied or use the first 20 chars of the description
      if(property_exists($item,"title")) {
        $title=$item->title;
      } elseif(property_exists($item,"description")) {
        $title=mb_substr($item->description,0,20,"UTF-8")."...";
      } else {
        throw new MalformedFeedException("Item $index does not have TITLE or DESCRIPTION");
      }
      
      //Try to get fulltext. Take content, description or the title as last resort
      //This is disabled, it doesnt work -...-
    /*    if(false && property_exists($item,"content")) {
        $content=$item->content;
      } else */
      if(isset($namespaces["content"]) && property_exists($item->children($namespaces["content"]),"encoded")) {
        $content=$item->children($namespaces["content"])->encoded;
      } elseif(property_exists($item,"description")) {
        $content=$item->description;
      } else {
        $content=$title;
      }
      
      //Try to get the link
      if(property_exists($item,"link")) {
        $link=$item->link;
      } else {
        $link="";
      }
      
      //Try to get date
      //See http://www.rssboard.org/rss-specification#optionalChannelElements - valid is RFC822, and the 4-year version aka RFC 1123
      if(property_exists($item,"pubDate")) {
        $d=parseTimestamp($item->pubDate);
      } else {
        $d=time();
      }
      
      //try to get author
      if(property_exists($item,"author"))
        $author=$item->author;
      else
        $author="";
      
      $itemObj->guid=(string)$guid;
      $itemObj->title=(string)$title;
      $itemObj->time=(int)$d;
      $itemObj->link=(string)$link;
      $itemObj->text=(string)$content;
      $itemObj->author=(string)$author;
      
      $this->items[]=$itemObj;
    }
  }
}

//look for new items in the feed and put them in the db
//if forceRescrape is set to true AND the feed has an xpath for scraping, then
//even "not-updated" items get rescraped.
function updateFeed($id,$forceRescrape=false) {
  //check if the feed is in the database already
  $q=new DB_Query("select * from feeds where id=?",$id);
  if($q->numRows!=1)
    throw new Exception("Feed $feed not in DB! Call Feed Add before Feed Update!");
  $row=$q->fetch();
  
  $log="Updating feed ".$row["url"]."\n";
  $feed=Feed::createFromUrl($row["url"]);
  //Try to get the icon
  $icon=$feed->icon;
  if($icon!="") {
    try {
      $data=CURL::get($icon);
      $mt="application/octet-stream";//@mime_content_type($icon);
      $feed->icon=sprintf("data:%s;base64,%s",$mt,base64_encode($data));
    } catch(CURLDownloadException $e) {
      $feed->icon="";
    }
  }
  $log.=print_r($feed,true);
  $log.="Items:\n";
  
  $i=0;
  foreach($feed->items as $item) {
    //check if we have an element with this guid (and if it needs updating)
    $q=new DB_Query("select * from feed_items where feed_id=? and guid=?",$row["id"],$item->guid);
    $log.="Item ".($i++)."\n";
    if($q->numRows==0) {
      $full="";
      if($row["scrape_data"]!="")
        $full=scrapeFeed($item->link,$row["scrape_data"]);
      if(is_array($full)) { $log.="Scrape fail at new item\n"; $item->text.="<br />(Scrape-Fehler: ".$full[0].")"; $full=""; }
      $q=new DB_Query("INSERT INTO `db_rss`.`feed_items` (`feed_id`, `id`, `guid`, `title`, `time`, `link`, `fulltext`,`author`, `scrape_fulltext`) VALUES (?, NULL, ?, ?, ?, ?, ?, ?,?);",$row["id"],$item->guid,$item->title,$item->time,$item->link,$item->text,$item->author,$full);
      $log.="\tItem added to DB, ID ".$q->insertId."\n";
    } elseif($q->numRows==1) {
      $db=$q->fetch();
      if($db["title"]!=$item->title || $db["link"]!=$item->link || $db["fulltext"]!=$item->text || $db["author"]!=$item->author || $forceRescrape) {
        $full="";
        if($row["scrape_data"]!="")
          $full=scrapeFeed($item->link,$row["scrape_data"]);
        if(is_array($full)) { $log.="Scrape fail at item ".$db["id"]."\n"; $item->text.="<br />(Scrape-Fehler: ".$full[0].")"; $full=""; }
        $q=new DB_Query("UPDATE feed_items SET `title`=?,`time`=?,`link`=?,`fulltext`=?,`author`=?,`scrape_fulltext`=? WHERE `feed_id`=? AND `id`=?",$item->title,$item->time,$item->link,$item->text,$item->author,$full,$row["id"],$db["id"]);
        $log.="\tItem updated in DB, ID ".$db["id"]."\n";
        $q=new DB_Query("DELETE FROM feed_read WHERE feed_id=? and item_id=?",$row["id"],$db["id"]);
      } else {
        $log.="\tItem current in DB, ID ".$db["id"]."\n";
      }
    } else {
      throw new Exception("SQL error: Item ".$row["id"]."/".$item->guid." has multiple entries!");
    }
  }
  $q2=new DB_Query("UPDATE `db_rss`.`feeds` SET `title`=?, `desc`=?, `link`=?, `ttl`=?, `lastread`=UNIX_TIMESTAMP(NOW()),`icon`=?,`mostrecent_ts`=(SELECT MAX(feed_items.time) FROM feed_items WHERE feed_items.feed_id=feeds.id) where id=?;",$feed->title,$feed->desc,$feed->link,$feed->ttl,$feed->icon,$id);
  return $log;
}

//load a HTML document and try to get the innerHTML of the node selected by xpath
//if return===false, then scrape failed
function scrapeFeed($link,$data) {
  $log="loading $link\n";
  
  try {
    $raw=CURL::get($link);
  } catch (CURLDownloadException $e) {
    return array("Konnte $link nicht laden\n");
  }
  //avoid stupid warnings caused by invalid HTML
  libxml_use_internal_errors(true);
  $doc = new DomDocumentCharset();
  $doc->loadHTMLCharset($raw);
  libxml_use_internal_errors(false);
  $xpath=new DOMXPath($doc);
  
  $adata=@json_decode($data);
  if($adata===null)
    $adata=array((object)array("site"=>"(.*)","xpath_inc"=>array($data),"xpath_exc"=>array()));
  
  $newdoc=new DOMDocument();
  
  foreach($adata as $sitedata) { //use multiple entries here for different sites with different xpath needs
    $log.=sprintf("trying site %s\n",$sitedata->site);
    if(preg_match("@".$sitedata->site."@isU",$link)!==1) {
      $log.=sprintf("%s did not match\n",$sitedata->site);
      continue;
    }
    foreach($sitedata->xpath_inc as $xpath_query) {
      $log.=sprintf("checking xpath %s\n",$xpath_query);
      $res=$xpath->evaluate($xpath_query);
      if($res===false || $res->length==0) {
        $log.=sprintf("xpath did not match\n");
        continue;
      }
      for($i=0;$i<$res->length;$i++) {
        $item=$res->item($i);
        $cloned=$item->cloneNode(true);
        $newdoc->appendChild($newdoc->importNode($cloned,true));
      }
    }
    foreach($sitedata->xpath_exc as $xpath_query) {
      $log.=sprintf("checking exclude xpath %s\n",$xpath_query);
      $xpath2=new DOMXPath($newdoc); //reconstruct this every time as $newdoc will change and the xpath must reflect that
      $res=$xpath2->evaluate($xpath_query);
      if($res===false || $res->length==0) {
        $log.=sprintf("xpath did not match\n");
        continue;
      }
      for($i=0;$i<$res->length;$i++) {
        $item=$res->item($i);
        $item->parentNode->removeChild($item);
      }
    }
  }
  $content=$newdoc->saveHTML();

  $log="<!--\n$log\n-->\n";
  if($content=="")
    return array("Scrape-Fehler: keine passenden Elemente gefunden!");
  return $log.$content;
}
