<?
//SH management - API - MySQL DB Interface - Query

//A single DB query
class DB_Query {
  //MySQLi link
  private $link=false;
  //DB object
  private $dbobj=false;
  //MySQLi statement
  private $stmt=false;
  //returned column names
  private $retNames=array();
  //returned column data
  private $retData=array();
  //the query
  private $query="";
  
  //number of rows after SELECT query
  public $numRows=false;
  //number of affected rows after UPDATE/INSERT/DELETE query
  public $affectedRows=false;
  
  
  //Prepare and execute a statement
  //Parameter(s): Query and additional parameters for prepared stmt
  function __construct($query) {
    DB::$querycount++;
    DB::$querytime-=microtime(true);

//     printf("Querying DB for '%s'",$query);
    
    //get a link
    if($this->dbobj===false) {
      $this->dbobj=DB::get();
      $this->link=$this->dbobj->getLink();
    }
    
    //Save the query
    $this->query=$query;
    
    //prepare a statement
    $this->stmt=$this->link->prepare($query);
    if($this->stmt===false)
      throw new Exception(sprintf("MySQLi stmt_prepare failed for '%s': %s",$query,$this->dbobj->getError()));
    
    //check if we have to bind parameters
    if(func_num_args()>1) {
      $args=func_get_args();
//      var_dump($args);
      array_shift($args); //remove query
      $args_str="'".implode("', '",$args)."'";
      // printf("Binding parameters %s",$args_str);
      $params_ref=array("");
      $typestr="";
      foreach($args as $k=>$arg) {
//printf("at %d:%d\n",$k,$arg);
        $params_ref[$k+1]=&$args[$k];
        if(is_int($arg))
          $typestr.="i";
        else
          $typestr.="s";
      }
//      var_dump($params_ref);
      $params_ref[0]=&$typestr;
//      var_dump($params_ref);
      $ret=call_user_func_array(array($this->stmt,"bind_param"),$params_ref);
      if($ret===false)
        throw new Exception(sprintf("MySQLi stmt_bind_param failed for '%s': %s",$query,$this->dbobj->getError()));
      
//       printf("Query is now %s %s",$query,$args_str);
    } else
      $args_str="";

    if(!isset(DB::$queries[$query."||".$args_str]))
      DB::$queries[$query."||".$args_str]=0;
    DB::$queries[$query."||".$args_str]++;
    
    //Execute
    $ret=$this->stmt->execute();
    if($ret===false)
      throw new Exception(sprintf("MySQLi stmt_execute failed for '%s': %s",$query,$this->dbobj->getError()));
    
    $this->stmt->store_result();
    //Statistics
    $this->numRows=$this->stmt->num_rows;
    $this->affectedRows=$this->stmt->affected_rows;
    $this->insertId=$this->link->insert_id;
    
    //Check for errors
    if($this->numRows===null || $this->numRows===false)
      throw new Exception(sprintf("MySQLi numRows indicates error for '%s': %s",$query,$this->dbobj->getError()));
    // printf("MySQLi numRows is %d",$this->numRows);
    if($this->affectedRows===null || $this->affectedRows===false)
      throw new Exception(sprintf("MySQLi affectedRows indicates error for '%s': %s",$query,$this->dbobj->getError()));
    // printf("MySQLi affectedRows is %d",$this->affectedRows);
    
    //if we don't have returned datasets, return to caller
    if($this->numRows==0) {
      DB::$querytime+=microtime(true);
      return;
    }
    
    //get return field names (if any)
    $meta=$this->stmt->result_metadata();
    $params_ref=array();
    while($field=$meta->fetch_field()) {
      $this->retNames[]=$field->name;
      $this->retData[$field->name]=$field->name;
      $params_ref[]=&$this->retData[$field->name];
    }
    $meta->close();
    $ret=call_user_func_array(array($this->stmt,"bind_result"),$params_ref);
    if($ret===false)
      throw new Exception(sprintf("MySQLi stmt_bind_result failed for '%s': %s",$query,$this->dbobj->getError()));

    DB::$querytime+=microtime(true);
  }
  
  function fetch() {
    DB::$querytime-=microtime(true);
    $ret=$this->stmt->fetch();
    if($ret===false)	//error
      throw new Exception(sprintf("MySQLi stmt_fetch failed for '%s': %s",$this->query,$this->dbobj->getError()));
    elseif($ret===null)	{	//no more data
      DB::$querytime+=microtime(true);
      return null;
    }

    //format log-string and resolve the references
    $dstr="";
    $da=array();
    $ret=array();
    foreach($this->retData as $name=>$data) {
      $da[]="$name=>$data";
      $ret[$name]=$data;
    }
    $dstr=implode(", ",$da);
    
    // printf("Fetched %s from db",$dstr);
    DB::$querytime+=microtime(true);
    //force array copy
    return $ret;
  }
  
  function free() {
    $this->stmt->close();
  }
}
