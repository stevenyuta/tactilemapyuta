function set_fileAPI_image(){
  var inputFile = $('#fileAPI_img');
  var reader = new FileReader();

  function fileChange(ev) { //ファイル選択ボタンを押下時
    var file = ev.target.files[0];
    var type = file.type;

    if (!type.match('image.*')) {
      alert('選択できるファイルは画像ファイルだけです。');
      inputFile.value = '';
      return;
    }
    reader.readAsDataURL(file);
  }
  function fileLoad() {
    import_image(reader.result); //画像の取り込み 引数には画像のアドレス
  }
  function fileClear() {
    this.value = null;
  }
  inputFile.on('click',fileClear);
  inputFile.on('change',fileChange);
  $(reader).on('load',fileLoad);
}


/******************************************************
//画像をインポートする関数
******************************************************/
function import_image(image_url){
  var image = draw.image(image_url).loaded(function(loader) {
    this.size(loader.width, loader.height)
    this.addClass('image');
    draw.select('.image').back();
    draw.select('.image').each(function(i , children){
      this.back();
    })
    cash_svg();
    let Image_radio = $('#EditImage_div');
    (draw.select('.image').first()) ? Image_radio.show() : Image_radio.hide();
  })
}

function set_imageOpacity(){
  if(draw.select('.image.edit_select').first()){
    let imageOpacity_flag = false;  //true: 選択状態のパスあり false: なし
    let imageOpacity = false  // strokewidth属性の値を格納、 false: strokewitdhが違うpathが2つ以上ある場合
    draw.select('.image.edit_select').each(function(i,children){
      if(!imageOpacity_flag){
        imageOpacity = this.attr('opacity');
        imageOpacity_flag = true;
      }else if(imageOpacity !== this.attr('opacity')){
        imageOpacity = false;
      }
    })
    if(imageOpacity_flag){
      if(imageOpacity===false){
        $('#ImageOpacity_TextBox').val('')
      }else{
        $("#ImageOpacity_Slider").slider("value",imageOpacity*100);
        $('#ImageOpacity_TextBox').val(imageOpacity*100)
      }
    }
  }
}
