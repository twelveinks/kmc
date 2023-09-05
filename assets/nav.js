pages();
function pages(){
  //document.querySelector('.index-template').toggleAttribute(show);
  document.getElementById('login-template').style.display="none";
  document.getElementById('button-login').addEventListener('click',function(event){
    if(event!='onclick'){
      document.getElementById('index-page').style.display="none";
      document.getElementById('login-template').style.display="block";
    }else{
      document.getElementById('index-page').style.display="block";
      document.getElementById('login-template').style.display="none";
    }
  });
}
