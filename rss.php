<?
//Feed abstractor classes


//Feed cannot be loaded
class FileLoadException extends Exception {
}
//Not valid XML
class XMLParseException extends Exception {
}
//Invalid feed type
class WrongFormatException extends Exception {
}
//Critical elements missing while feed parsing
class MalformedFeedException extends Exception {
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
  
  public static function createFromUrl($url) {
    //get content
    $content=@file_get_contents($url);
    if($content===false)
      throw new FileLoadException("Fehler beim Laden des Feeds $url");
    
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
        $d=DateTime::createFromFormat(DateTime::RFC3339,$val);
        if($d===false)
          $d=DateTime::createFromFormat("Y-m-d\TH:i:s.uP",$val);
        if($d===false)
          throw new MalformedFeedException("Failed to parse timestamp ".$val);
        $d=$d->getTimestamp();
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
        $d=DateTime::createFromFormat(DateTime::RFC3339,$val);
        if($d===false)
          throw new MalformedFeedException("Failed to parse timestamp ".$val);
        $d=$d->getTimestamp();
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
        //First, use RFC822
        $d=DateTime::createFromFormat(DateTime::RFC822,$item->pubDate);
        if($d===false) {
          //Try RFC1123
          $d=DateTime::createFromFormat(DateTime::RFC1123,$item->pubDate);
        }
        if($d===false)
          throw new MalformedFeedException("Failed to parse timestamp ".$item->pubDate);
        $d=$d->getTimestamp();
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
function updateFeed($id) {
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
    $data=@file_get_contents($icon);
    $mt="application/octet-stream";//@mime_content_type($icon);
    if($data!==false) {
      $feed->icon=sprintf("data:%s;base64,%s",$mt,base64_encode($data));
    }
  }
  $log.=print_r($feed,true);
  $log.="Items:\n";
  $q2=new DB_Query("UPDATE `db_rss`.`feeds` SET `title`=?, `desc`=?, `link`=?, `ttl`=?, `lastread`=UNIX_TIMESTAMP(NOW()),`icon`=? where id=?;",$feed->title,$feed->desc,$feed->link,$feed->ttl,$feed->icon,$id);
  $i=0;
  foreach($feed->items as $item) {
    //check if we have an element with this guid (and if it needs updating)
    $q=new DB_Query("select * from feed_items where feed_id=? and guid=?",$row["id"],$item->guid);
    $log.="Item ".($i++)."\n";
    if($q->numRows==0) {
      $q=new DB_Query("INSERT INTO `db_rss`.`feed_items` (`feed_id`, `id`, `guid`, `title`, `time`, `link`, `fulltext`,`author`) VALUES (?, NULL, ?, ?, ?, ?, ?, ?);",$row["id"],$item->guid,$item->title,$item->time,$item->link,$item->text,$item->author);
      $log.="\tItem added to DB, ID ".$q->insertId."\n";
    } elseif($q->numRows==1) {
      $db=$q->fetch();
      if($db["title"]!=$item->title || $db["link"]!=$item->link || $db["fulltext"]!=$item->text || $db["author"]!=$item->author) {
        $q=new DB_Query("UPDATE feed_items SET `title`=?,`time`=?,`link`=?,`fulltext`=?,`author`=? WHERE `feed_id`=? AND `id`=?",$item->title,$item->time,$item->link,$item->text,$item->author,$row["id"],$db["id"]);
        $log.="\tItem updated in DB, ID ".$db["id"]."\n";
        $q=new DB_Query("DELETE FROM feed_read WHERE feed_id=? and item_id=?",$row["id"],$db["id"]);
      } else {
        $log.="\tItem current in DB, ID ".$db["id"]."\n";
      }
    } else {
      throw new Exception("SQL error: Item ".$row["id"]."/".$guid." has multiple entries!");
    }
  }
  return $log;
}
