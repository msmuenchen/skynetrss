<?
class User extends DBObj {
  protected static $__table="users";
  
  //overrides parent for password-backup
  public function loadFrom($id,$recurse=true) {
    parent::loadFrom($id,$recurse);
    //back up the old password so we can compare against it
    //in commit() to save us a getById call there
    $this->__password=$this->password;
  }
  //pre-commit interceptor to check for password change
  public function commit() {
    if(!property_exists($this,"__password"))
      $this->__password="\0";
    
    if($this->__password!==$this->password) {
      $version=0;
      $iterations=1;
      $alg="sha256";
      $salt=generateSalt();
      $pass=$this->password;
      $hash=hash($alg,$pass.$salt);
      $newpw=sprintf("%d:%d:%s:%s:%s",0,1,"sha256",$hash,$salt);
      $this->password=$newpw;
    }
    parent::commit();
  }
  public function validate() {
    parent::validate();
    //check 1: check for another user with same login name
    $sameNameCheck=static::getByFilter("where name=? and id!=?",$this->name,$this->id);
    if(sizeof($sameNameCheck)>0)
      $this->__invalidFields[]="name";
  }
}
