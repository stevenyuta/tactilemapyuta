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
    let thre_xy = 3; //線へ自動接続される範囲
    let ci="EMPTY",cj="EMPTY",ck="EMPTY";
    let Min_dis = "EMPTY" , thre_Min_dis=3;
    let mini_pA, mini_pB, mini_pC
    let mini_x1 , mini_y1 , mini_x2 , mini_y2
    let path_x1 , path_y1 , path_x2 , path_y2
    draw.select('.connected:not(.drawing_path)').each(function(i,children){
      let dpoint = this.clear().array().settle() //pathのdpoint配列を取得
      for(let j=0; j < dpoint.length - 1; j++){
        if(dpoint[j + 1][0] !== 'Z'){
          path_x1 = Number( dpoint[j][1]) , path_y1 = Number( dpoint[j][2])
          path_x2 = Number( dpoint[j + 1][1]) , path_y2 = Number( dpoint[j + 1][2])
        }else{
          path_x1 = Number( dpoint[j][1]) , path_y1 = Number( dpoint[j][2])
          path_x2 = Number( dpoint[0][1]) , path_y2 = Number( dpoint[0][2])
        }

        let pA = -Number(path_y2) + Number(path_y1)//補正前の直線パラメータのa,b,c
        let pB =  Number(path_x2) - Number(path_x1)
        let pC = -pA * Number(path_x1) - pB * Number(path_y1);

        let x1 = path_x1  //座標パラメータ取得
        let y1 = path_y1
        let x2 = path_x2
        let y2 = path_y2

        let relativeXY = get_relativeXY(x1,y1,x2,y2,thre_xy); //直線の領域のx,y座標

        if(mx < relativeXY.max_x && mx > relativeXY.min_x && my < relativeXY.max_y && my > relativeXY.min_y){ //マウスポイントが閾値の領域内にあったら
          let dis = Math.abs(pA * mx + pB * my + pC)/Math.sqrt(pA * pA + pB * pB); //直線とマウスポイントの距離
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
      let relativeXY = get_relativeXY(mini_x1,mini_y1,mini_x2,mini_y2,thre_xy); //直線の領域のx,y座標
      let change_x = (mini_pB * mini_pB * mx - mini_pA * mini_pB * my - mini_pA * mini_pC)/(mini_pA * mini_pA + mini_pB * mini_pB);
      let change_y =  - (mini_pA * mini_pB * mx - mini_pA * mini_pA * my + mini_pB * mini_pC)/(mini_pA * mini_pA + mini_pB * mini_pB);
      if(change_x < (relativeXY.min_x + thre_xy) )  change_x = relativeXY.min_x + thre_xy;
      if(change_x > (relativeXY.max_x - thre_xy) )  change_x = relativeXY.max_x - thre_xy;
      if(change_y < (relativeXY.min_y + thre_xy) )  change_y = relativeXY.min_y + thre_xy;
      if(change_y > (relativeXY.max_y - thre_xy) )  change_y = relativeXY.max_y - thre_xy;
      mx = change_x;
      my = change_y;
    }
    let mouse = new Object();
    mouse.x = mx;
    mouse.y = my;
    return mouse;
  }else if(mode==='15degree'){
    if(param1===undefined || param2===undefined)console.log('getmousepoint_error Insufficient parameters');
    let prepoint_x = param1,prepoint_y = param2;
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    let atan = Math.atan((my-prepoint_y)/(mx-prepoint_x)); //角度計算
    let norm = Math.sqrt( (my-prepoint_y)*(my-prepoint_y) + (mx-prepoint_x)*(mx-prepoint_x) );
    let arg = Math.round(atan*12/Math.PI)*Math.PI/12;
    let line_a = Math.tan(arg),line_b = -1,line_c = prepoint_y-prepoint_x*line_a;
    let connect_x = (line_b * line_b * mx - line_a * line_b * my - line_a * line_c)/(line_a * line_a + line_b * line_b);
    let connect_y =  - (line_a * line_b * mx - line_a * line_a * my + line_b * line_c)/(line_a * line_a + line_b * line_b);
    mx = connect_x;
    my = connect_y;

    let mouse = new Object();
    mouse.x = mx;
    mouse.y = my;
    return mouse;
  }else if(mode==='90degree'){
    if(param1===undefined || param2===undefined)console.log('getmousepoint_error Insufficient parameters');
    let prepoint_x = param1,prepoint_y = param2;
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    if(mx !== prepoint_x){
      let atan = Math.atan((my-prepoint_y)/(mx-prepoint_x));
      let norm = Math.sqrt( (my-prepoint_y)*(my-prepoint_y) + (mx-prepoint_x)*(mx-prepoint_x) );
      let arg = Math.round(atan*2/Math.PI)*Math.PI/2;
      let line_a = Math.tan(arg);
      let line_b = -1;
      let line_c = prepoint_y-prepoint_x*line_a;
      let connect_x = (line_b * line_b * mx - line_a * line_b * my - line_a * line_c)/(line_a * line_a + line_b * line_b);
      let connect_y =  - (line_a * line_b * mx - line_a * line_a * my + line_b * line_c)/(line_a * line_a + line_b * line_b);
      mx = connect_x
      my = connect_y
    }
      let mouse = new Object();
      mouse.x = mx;
      mouse.y = my;
    return mouse;
  }else if(mode==='normal'){
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    let mouse = new Object();
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
       draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
         this.front();
         let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
         if(ghost_path) this.before(ghost_path);
       })
       break;
     case 'forward_button': // ← key
       draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
         this.forward();
         let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
         if(ghost_path) this.before(ghost_path);
       })
       break;
     case 'backward_button': // ← key
       draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
         this.backward();
         let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
         if(ghost_path) this.before(ghost_path);
       })
       break;
     case 'back_button': // ← key
       draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
         this.back();
         let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
         if(ghost_path) this.before(ghost_path);
       })
       break;
     default:
  }
  draw.select('.fragmented_RectGroup').each(function(i , children){
    this.front();
  })
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

    /*線モードでのfillボタン*/
    $('input[name="draw_line_fillRadio"]:radio').off('change').on('change',function(){
      draw.select('.drawing_path').fill($('input[name="draw_line_fillRadio"]:checked').val())
    });


    /**選択モードでのfillボタン*/
    $("#fillnone_button").click(change_fill)
    $("#white_button").click(change_fill)
    $("#gray_button").click(change_fill)
    $("#diagonal_button").click(change_fill)
    $("#polkadot_button").click(change_fill)
    $("#polkadot_water_button").click(change_fill)


    function change_fill(){
      let button_id = this.id
      let fill_complete_flag = false; //fillの変更があった場合にtrue svg_cash用
      draw.select(".edit_select , .fragmented_PathGroup").each(function(i,children){
        let fill_flag = false;
        if(this.hasClass('connected')){
          fill_flag = true;
        }else if(this.hasClass('circle')){
          fill_flag = true;
        }else if(SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'))){
          fill_flag = true;
        }

        if(fill_flag){
          fill_complete_flag = true;
          switch(button_id){
            case 'fillnone_button': // ← key
              if(this.hasClass('fragmented_PathGroup')){
                SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number')).attr({'fill' : 'none'});
                this.attr({'fill_tmp': 'none'});
              }else{
                this.fill('none');
              }
              break;

              case 'white_button': // ← key
                if(this.hasClass('fragmented_PathGroup')){
                  SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number')).attr({'fill' : '#fff'});
                  this.attr({'fill_tmp': '#fff'});
                }else{
                  this.fill('#fff');
                }
                break;

              case 'gray_button': // ← key
                if(this.hasClass('fragmented_PathGroup')){
                  SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number')).attr({'fill' : '#333'});
                  this.attr({'fill_tmp': '#333'});
                }else{
                  this.fill('#333')
                }
                break;

              case 'diagonal_button': // ← key
                if(this.hasClass('fragmented_PathGroup')){
                  SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number')).attr({'fill' : 'url(#diagonal-texture)'});
                  this.attr({'fill_tmp': 'url(#diagonal-texture)'});
                }else{
                  this.fill('url(#diagonal-texture)')
                }
                break;

              case 'polkadot_button': // ← key
                if(this.hasClass('fragmented_PathGroup')){
                  SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number')).attr({'fill' : 'url(#polkadot-texture)'});
                  this.attr({'fill_tmp': 'url(#polkadot-texture)'});
                }else{
                  this.fill('url(#polkadot-texture)')
                }
                break;

              case 'polkadot_water_button': // ← key
                if(this.hasClass('fragmented_PathGroup')){
                  SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number')).attr({'fill' : 'url(#polkadot_water-texture)'});
                  this.attr({'fill_tmp': 'url(#polkadot_water-texture)'});
                }else{
                  this.fill('url(#polkadot_water-texture)')
                }
                break;

              default:
          }
        }
      })
      if(fill_complete_flag) cash_svg();
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
  function rect_delete(){
    draw.select('.edit_rect , .init_node , .last_node , .close_node').each(function(i,children){
        this.remove();
    })
    draw.select('.fragmented_RectGroup').each(function(i,children){
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

    let diagonal_pattern = draw.pattern(8, 8, function(add) {
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

    let polkadot_pattern = draw.pattern(10, 20, function(add) {
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


    let polkadot_water_pattern = draw.pattern(10, 20, function(add) {
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
    let line_a = -y2 + y1; //直線パラメータのa,b,c
    let line_b = x2 - x1;
    let line_c = -line_a * x1 - line_b * y1;

    let line_param = new Object();
    line_param.a = line_a;
    line_param.b = line_b;
    line_param.c = line_c;
    return line_param;
  }

  /***********************************
  //relative_select
  ***********************************/
  function get_relativeXY(x1,y1,x2,y2,threshold)  {
    let max_x = Math.max(x1, x2) , max_y = Math.max(y1, y2);
    let min_x = Math.min(x1, x2) , min_y = Math.min(y1, y2);

    let relativeXY = new Object();
    relativeXY.max_x = max_x + threshold;
    relativeXY.min_x = min_x - threshold;
    relativeXY.max_y = max_y + threshold;
    relativeXY.min_y = min_y - threshold;

    return relativeXY;
  }

  //sleep関数：引数[ms]待つ
  function js_sleep(waitMsec) {
    let startMsec = new Date();
    // 指定ミリ秒間、空ループ。CPUは常にビジー。
    while (new Date() - startMsec < waitMsec);
  }
