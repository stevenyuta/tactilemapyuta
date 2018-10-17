/******************************************************
//描画領域でのマウス位置の取得
******************************************************/

function getmousepoint(mode,mouseevent,param1,param2,param3,param4){
  if(mode===undefined || mouseevent===undefined){
    console.log('パラメータが正しくありません');
    return false;
  }
  if(mode==="connect"){
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    var thre_xy = 3; //線へ自動接続される範囲
    var ci="EMPTY",cj="EMPTY",ck="EMPTY";
    var Min_dis = "EMPTY",thre_Min_dis=3;
    var mini_pA, mini_pB, mini_pC
    var mini_x1 , mini_y1 , mini_x2 , mini_y2
    draw.select('.connected').each(function(i,children){
      var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
      for(var j=0; j < dpoint.length - 1; j++){
        if(dpoint[j + 1][0] !== 'Z'){
          var path_x1 = Number( dpoint[j][1])
          var path_y1 = Number( dpoint[j][2])
          var path_x2 = Number( dpoint[j + 1][1])
          var path_y2 = Number( dpoint[j + 1][2])
        }else{
          var path_x1 = Number( dpoint[j][1])
          var path_y1 = Number( dpoint[j][2])
          var path_x2 = Number( dpoint[0][1])
          var path_y2 = Number( dpoint[0][2])
        }

        var pA = -Number(path_y2) + Number(path_y1)//補正前の直線パラメータのa,b,c
        var pB =  Number(path_x2) - Number(path_x1)
        var pC = -pA * Number(path_x1) - pB * Number(path_y1);

        var x1 = path_x1  //座標パラメータ取得
        var y1 = path_y1
        var x2 = path_x2
        var y2 = path_y2

        var relativeXY = get_relativeXY(x1,y1,x2,y2,thre_xy); //直線の領域のx,y座標

        if(mx < relativeXY.max_x && mx > relativeXY.min_x && my < relativeXY.max_y && my > relativeXY.min_y){ //マウスポイントが閾値の領域内にあったら
          var dis = Math.abs(pA * mx + pB * my + pC)/Math.sqrt(pA * pA + pB * pB); //直線とマウスポイントの距離
          if(Min_dis==="EMPTY"){ //Min_disがEMPTY(一度も書き換えられていない)
            Min_dis = dis;
            mini_pA = pA , mini_pB = pB , mini_pC = pC
            mini_x1= x1 , mini_y1= y1 , mini_x2= x2 , mini_y2= y2
          }else{
            if(Min_dis > dis){
              Min_dis = dis; //disが最小ならば
              mini_pA = pA , mini_pB = pB , mini_pC = pC
              mini_x1= x1 , mini_y1= y1 , mini_x2= x2 , mini_y2= y2
            }
          }
        }
      }
    })
    if(Min_dis!=="EMPTY" && Min_dis < thre_Min_dis){ //Min_disがEMPTYでなく、1以下なら
      var relativeXY = get_relativeXY(mini_x1,mini_y1,mini_x2,mini_y2,thre_xy); //直線の領域のx,y座標
      var change_x = (mini_pB * mini_pB * mx - mini_pA * mini_pB * my - mini_pA * mini_pC)/(mini_pA * mini_pA + mini_pB * mini_pB);
      var change_y =  - (mini_pA * mini_pB * mx - mini_pA * mini_pA * my + mini_pB * mini_pC)/(mini_pA * mini_pA + mini_pB * mini_pB);
      if(change_x < (relativeXY.min_x + thre_xy) )  change_x = relativeXY.min_x + thre_xy;
      if(change_x > (relativeXY.max_x - thre_xy) )  change_x = relativeXY.max_x - thre_xy;
      if(change_y < (relativeXY.min_y + thre_xy) )  change_y = relativeXY.min_y + thre_xy;
      if(change_y > (relativeXY.max_y - thre_xy) )  change_y = relativeXY.max_y - thre_xy;
      mx = change_x;
      my = change_y;
    }

    var mouse = new Object();
    mouse.x = mx;
    mouse.y = my;
    return mouse;
  }else if(mode==='15degree'){
    if(param1===undefined || param2===undefined)console.log('getmousepoint_error Insufficient parameters');
    var prepoint_x = param1,prepoint_y = param2;
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    var atan = Math.atan((my-prepoint_y)/(mx-prepoint_x)); //角度計算
    var norm = Math.sqrt( (my-prepoint_y)*(my-prepoint_y) + (mx-prepoint_x)*(mx-prepoint_x) );
    var arg = Math.round(atan*12/Math.PI)*Math.PI/12;
    var line_a = Math.tan(arg),line_b = -1,line_c = prepoint_y-prepoint_x*line_a;
    var connect_x = (line_b * line_b * mx - line_a * line_b * my - line_a * line_c)/(line_a * line_a + line_b * line_b);
    var connect_y =  - (line_a * line_b * mx - line_a * line_a * my + line_b * line_c)/(line_a * line_a + line_b * line_b);
    mx = connect_x;
    my = connect_y;

    var mouse = new Object();
    mouse.x = mx;
    mouse.y = my;
    return mouse;
  }else if(mode==='90degree'){
    if(param1===undefined || param2===undefined)console.log('getmousepoint_error Insufficient parameters');
    var prepoint_x = param1,prepoint_y = param2;
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    if(mx !== prepoint_x){
      var atan = Math.atan((my-prepoint_y)/(mx-prepoint_x));
      var norm = Math.sqrt( (my-prepoint_y)*(my-prepoint_y) + (mx-prepoint_x)*(mx-prepoint_x) );
      var arg = Math.round(atan*2/Math.PI)*Math.PI/2;
      var line_a = Math.tan(arg);
      var line_b = -1;
      var line_c = prepoint_y-prepoint_x*line_a;
      var connect_x = (line_b * line_b * mx - line_a * line_b * my - line_a * line_c)/(line_a * line_a + line_b * line_b);
      var connect_y =  - (line_a * line_b * mx - line_a * line_a * my + line_b * line_c)/(line_a * line_a + line_b * line_b);
      mx = connect_x
      my = connect_y
    }
      var mouse = new Object();
      mouse.x = mx;
      mouse.y = my;
    return mouse;
  }else if(mode==='normal'){
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    var mouse = new Object();
    mouse.x = mx;
    mouse.y = my;
    return mouse;
  }
}

/******************************************************
//layerを操作する関数
******************************************************/
function layer_change(e){
 switch(this.id){
     case 'front_button': // ← key
       draw.select('.edit_select').each(function(i , children){
         this.front();
       })
       break;
     case 'forward_button': // ← key
       draw.select('.edit_select').each(function(i , children){
           this.forward();
       })
       break;
     case 'backward_button': // ← key
       draw.select('.edit_select').each(function(i , children){
           this.backward();
       })
       break;
     case 'back_button': // ← key
       draw.select('.edit_select').each(function(i , children){
           this.back();
       })
       break;
     default:
  }
  SVG.get('guiderect_group').front();
  SVG.get('gridline_group').front();
  SVG.get('handle_group').front();
  draw.select('.image').back();
  draw.select('.image').each(function(i , children){
    this.back();
  })
  if(draw.select('.edit_select').first()) cash_svg();
}


  /***********************************
  //Fillを変更するボタンを設定する関数
  ***********************************/
  function set_fillbutton(){
    $("#fillnone_button").click(change_fill)
    $("#white_button").click(change_fill)
    $("#gray_button").click(change_fill)
    $("#diagonal_button").click(change_fill)
    $("#polkadot_button").click(change_fill)
    $("#polkadot_water_button").click(change_fill)


    function change_fill(){
      var button_id = this.id
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('connected')){
          var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
          for(var j=0;j<dpoint.length;j++){
            if(dpoint[j][0]==="Z"){
              switch(button_id){
                case 'fillnone_button': // ← key
                  this.fill('none')
                  break;

                case 'white_button': // ← key
                  this.fill('#fff')
                  break;

                case 'gray_button': // ← key
                  this.fill('#333')
                  break

                case 'diagonal_button': // ← key
                  this.fill('url(#diagonal-texture)')
                  break

                case 'polkadot_button': // ← key
                  this.fill('url(#polkadot-texture)')
                  break

                case 'polkadot_water_button': // ← key
                  this.fill('url(#polkadot_water-texture)')
                  break

                default:
              }
              cash_svg();
            }
          }
        }
      })
    }
  }

  /***********************************
  //dummyを一掃削除する関数
  ***********************************/
  function dummy_delete(){
    draw.select('.dummy').each(function(i,children){
      this.remove();
    })
  }

  /***********************************
  //circleを一掃削除する関数
  ***********************************/
  function circle_delete(){
    draw.select('.edit_circle').each(function(i,children){
        this.remove();
    })
    draw.select('.fragmented_CircleGroup').each(function(i,children){
        this.remove();
    })
  }

  /***********************************
  //rectを一掃削除する関数
  ***********************************/
  function select_rect_delete(){
    draw.select('.select_rect').each(function(i,children){
        this.remove();
    })
  }

  /******************************************************
  //塗りつぶし用のテクチャ属性を定義する関数
  ******************************************************/

  function defs_set(){

    draw.select('.pattern').each(function(i, children){
      this.remove()
    })

    var diagonal_pattern = draw.pattern(8, 8, function(add) {
      add.rect(8 , 8).attr({
        'fill' : '#fff'
      })
      add.line(6.5 , 0 , 6.5 , 8).attr({
        'stroke' : '#000000',
        'stroke-width' : '1.5'
      })
    })
    diagonal_pattern.attr({
      'id' : 'diagonal-texture',
      'patternTransform' : 'rotate(45)'
    }).addClass('pattern')

    var polkadot_pattern = draw.pattern(10, 20, function(add) {
      add.rect(10 , 20).attr({
        'fill' : '#fff'
      })
      add.circle(5).attr({
        'cx' : '5',
        'cy' : '0',
        'fill' : '#000'
      })
      add.circle(5).attr({
        'cx' : '0',
        'cy' : '10',
        'fill' : '#000'
      })
      add.circle(5).attr({
        'cx' : '10',
        'cy' : '10',
        'fill' : '#000'
      })
      add.circle(5).attr({
        'cx' : '5',
        'cy' : '20',
        'fill' : '#000'
      })
    })
    polkadot_pattern.attr({
      'id' : 'polkadot-texture'
    }).addClass('pattern')


    var polkadot_water_pattern = draw.pattern(10, 20, function(add) {
      add.rect(10 , 20).attr({
        'fill' : '#1E90FF'
      })
      add.circle(5).attr({
        'cx' : '5',
        'cy' : '0',
        'fill' : '#000'
      })
      add.circle(5).attr({
        'cx' : '0',
        'cy' : '10',
        'fill' : '#000'
      })
      add.circle(5).attr({
        'cx' : '10',
        'cy' : '10',
        'fill' : '#000'
      })
      add.circle(5).attr({
        'cx' : '5',
        'cy' : '20',
        'fill' : '#000'
      })
    })
    polkadot_water_pattern.attr({
      'id' : 'polkadot_water-texture'
    }).addClass('pattern')

  }

  /***************************************
  //直線パラメータを取得
  ****************************************/
  function getLineParam(x1,y1,x2,y2) {
    var line_a = -y2 + y1; //直線パラメータのa,b,c
    var line_b = x2 - x1;
    var line_c = -line_a * x1 - line_b * y1;

    var line_param = new Object();
    line_param.a = line_a;
    line_param.b = line_b;
    line_param.c = line_c;
    return line_param;
  }

  /***********************************
  //relative_select
  ***********************************/
  function get_relativeXY(x1,y1,x2,y2,threshold)  {
    var max_x = Math.max(x1, x2) , max_y = Math.max(y1, y2);
    var min_x = Math.min(x1, x2) , min_y = Math.min(y1, y2);

    var relativeXY = new Object();
    relativeXY.max_x = max_x + threshold;
    relativeXY.min_x = min_x - threshold;
    relativeXY.max_y = max_y + threshold;
    relativeXY.min_y = min_y - threshold;

    return relativeXY;
  }

  //sleep関数：引数[ms]待つ
  function js_sleep(waitMsec) {
    var startMsec = new Date();
    // 指定ミリ秒間、空ループ。CPUは常にビジー。
    while (new Date() - startMsec < waitMsec);
  }
