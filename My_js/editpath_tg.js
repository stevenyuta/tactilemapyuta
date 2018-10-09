function editpath(){
  for(var i=0; i < editpath_array.length; i++){
    var select_element = SVG.get("#" + editpath_array[i]);
    if(select_element){
      if(select_element.hasClass('connected')){
        toFragmented(select_element);
        select_element.remove();
      }
    }
  }
  if(editpath_array.length > 0){
    update_editElement();
    fragmentedPath_EventSet();
    edit_circle_EventSet();
  }
  editpath_mousemove('connect');
  editpath_hover(true);
  editpath_keydown();
  editpath_keyup();
  $('#node_connect').off('click').click(node_connect_function);

  $(document).off('mouseup').on('mouseup',function(event){ //mouseup終了時の処理
    while(arrIntervalCnt.length !== 0) {  clearInterval(arrIntervalCnt.shift())  }
    editpath_hover(true);
  })
  set_contextMenu();
  var mx = 0 , my = 0;
  var base_x = 0 , base_y = 0;
}
//マウスを動かしているときの関数
function editpath_mousemove(mode,param1,param2){
  switch(mode){
    case 'connect':
      draw.off('mousemove').mousemove(function(e){
        mx = getmousepoint('connect',e).x ,  my = getmousepoint('connect',e).y;
      });
      break;
    case '90degree':
      draw.off('mousemove').mousemove(function(e){
        mx = getmousepoint('90degree',e,param1,param2).x , my = getmousepoint('90degree',e,param1,param2).y;
      });
      break;
    default:
      draw.off('mousemove').mousemove(function(e){
        mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
      });
      break;
  }
}
/******************************************************
//hoverしたときの関数
******************************************************/
function editpath_hover(mode){
  draw.select('.connected').off('mouseover').off('mouseout');
  draw.select('.fragmented').off('mouseover').off('mouseout');
  draw.select('.path_edit_frag').off('mouseover').off('mouseout');
  draw.select('.edit_circle').off('mouseover').off('mouseout');
  if(mode){
    draw.select('.connected').mouseover(function() {
      this.attr({
        'stroke' : PATH_SELECT_COLOR,
        'cursor' : 'pointer'
      });
      this.off('mousedown',editpath_mousedown).mousedown(editpath_mousedown);
    })
    draw.select('.connected').mouseout(function() {
      this.attr({
        'stroke' : PATH_STROKE_COLOR,
        'cursor':'default'
      });
      this.off('mousedown',editpath_mousedown);
    })
    draw.select('.fragmented:not(.editing_target)').mouseover(function() {
      this.attr({
        'stroke' : PATH_EDIT_COLOR,
        'cursor':'pointer'
      });
    })
    draw.select('.fragmented:not(.editing_target)').mouseout(function() {
      this.attr({
        'stroke': PATH_SELECT_COLOR,
        'cursor':'default'
      });
    })
    //ノード（edit_circle）のイベントセット
    draw.select('.edit_circle:not(.editing_target)').mouseover(function() {
      this.attr({
        'fill': CIRCLE_EDIT_COLOR,
        'cursor':'pointer'
      });
    })
    draw.select('.edit_circle:not(.editing_target)').mouseout(function() {
      this.attr({
        'fill': CIRCLE_COLOR,
        'cursor':'default'
      })
    })
  }
}


//クリック時に起動する関数
function editpath_mousedown(){
  if(!input_key_buffer[16]) toConnected(); //shiftキーを押していない場合：バラバラ状態のpathを全てくっつき状態にする
  get_node_connectCircle();
  toFragmented(this); //clickしたpathをバラバラ状態にする
  update_editElement();
  fragmentedPath_EventSet();
  edit_circle_EventSet();
  editpath_hover(true); //hoverイベントの再更新
  this.remove(); //クリックしたpath要素は削除
}

/********************************
//キーを押したときに起動する関数
*********************************/
function editpath_keydown(){
  $(document).keydown(function(e){
    if(e.ctrlKey){ //ctrlキー押下時
       if(!input_key_buffer[e.keyCode]){
        editpath_mousemove('90degree', mx, my);
        input_key_buffer[e.keyCode] = true;
      }
    }
    switch(e.keyCode){
      case 37: // ← //カーソルキーによる微小移動処理
      case 38: // ↑
      case 39: // →
      case 40: // ↓
        e.preventDefault();
        draw.select('.editing_target').each(function(i, children){
          if(this.hasClass('edit_circle')){
            let orig_cx = this.attr('cx') ,orig_cy =  this.attr('cy');
            let cx = 0 , cy = 0;
            if(e.keyCode===37) cx = orig_cx - CURSOR_KEY_MOVE , cy = orig_cy;
            if(e.keyCode===38) cy = orig_cy - CURSOR_KEY_MOVE , cx = orig_cx;
            if(e.keyCode===39) cx = orig_cx + CURSOR_KEY_MOVE , cy = orig_cy;
            if(e.keyCode===40) cy = orig_cy + CURSOR_KEY_MOVE , cx = orig_cx;
            this.attr({'cx':cx}) , this.attr({'cy':cy}); //円の位置を格納
            let nears = getSimultaneouslyEdit_element(this);
            if(nears.afterPath){
              let dpoint = nears.afterPath.clear().array().settle(); //pathのdpoint配列を取得
              nears.afterPath.attr({'d':''}).M({x: cx, y: cy}).L({x: dpoint[1][1], y: dpoint[1][2]});
            }
            if(nears.beforePath){
              let dpoint = nears.beforePath.clear().array().settle() //pathのdpoint配列を取得
              nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: cx, y: cy});
            }
          }else{
            let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
            let x1 = 0 , y1 = 0 , x2 = 0 , y2 = 0;
            if(e.keyCode===37) x1 = dpoint[0][1] - CURSOR_KEY_MOVE , y1 = dpoint[0][2] , x2 = dpoint[1][1] - CURSOR_KEY_MOVE , y2 = dpoint[1][2];
            if(e.keyCode===38) x1 = dpoint[0][1] , y1 = dpoint[0][2] - CURSOR_KEY_MOVE , x2 = dpoint[1][1] , y2 = dpoint[1][2] - CURSOR_KEY_MOVE;
            if(e.keyCode===39) x1 = dpoint[0][1] + CURSOR_KEY_MOVE , y1 = dpoint[0][2] , x2 = dpoint[1][1] + CURSOR_KEY_MOVE , y2 = dpoint[1][2];
            if(e.keyCode===40) x1 = dpoint[0][1] , y1 = dpoint[0][2] + CURSOR_KEY_MOVE , x2 = dpoint[1][1] , y2 = dpoint[1][2] + CURSOR_KEY_MOVE;
            this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
            let nears = getSimultaneouslyEdit_element(this);
            if(nears.beforeCircle) nears.beforeCircle.attr({'cx':x1,'cy':y1});
            if(nears.afterCircle) nears.afterCircle.attr({'cx':x2,'cy':y2});
            if(nears.beforePath){
              let dpoint = nears.beforePath.clear().array().settle(); //pathのdpoint配列を取得
              nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
            }
            if(nears.afterPath){
              let dpoint = nears.afterPath.clear().array().settle() //pathのdpoint配列を取得
              nears.afterPath.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
            }
          }
        })
        break;
      case 46: // delete key
        delete_editpath();
        break;
      case 16: //shift key
        input_key_buffer[e.keyCode] = true;
        break;
    }
  })
}

/*********************************************
//キーを離したときに起動する関数
**********************************************/
function editpath_keyup(){
  $(document).off('keyup').keyup(function(e){
    input_key_buffer[e.keyCode] = false;
    if(!e.ctrlKey){ //ctrlキー押下時
      editpath_mousemove('connect');
      if(draw.select('.editing_path').first()) editpath_mousemove('normal');
    }
  })
}

//くっつき状態のpathをバラバラ状態にする関数
function toFragmented(connectedPath){
  editpath_array.push(connectedPath.attr('id'));
  let max_frag_num = getMax_fragmented_Group_Number(); //connectedがもつfrag_numの最大数を取得する
  let dpoint = connectedPath.clear().array().settle();
  let fragmented_PathGroup = draw.group().addClass('fragmented_PathGroup');
  let fragmented_CircleGroup = draw.group().addClass('fragmented_CircleGroup');
  fragmented_PathGroup.attr({
    'id' : 'fragmented_PathGroup_' + String(max_frag_num + 1),
    'fragmented_Group_Number' : String(max_frag_num + 1),
    'connected_id' : connectedPath.attr('id'),
    'fill_tmp': connectedPath.attr('fill')
  })
  fragmented_CircleGroup.attr({
    'id' : 'fragmented_CircleGroup_' + String(max_frag_num + 1),
    'fragmented_Group_Number' : String(max_frag_num + 1)
  })
  if(dpoint[dpoint.length-1][0]==="Z"){
    fragmented_PathGroup.addClass('close');
    fragmented_CircleGroup.addClass('close');
  }
  connectedPath.after(fragmented_PathGroup);
  for(let j = 0; j < dpoint.length - 1; j++){
    let fragmentedPath = fragmented_PathGroup.path().addClass('fragmented').addClass('SVG_Element').addClass('path');
    let circle = fragmented_CircleGroup.circle().addClass('edit_circle').front(); ////重ね順を一番前に
    fragmentedPath.attr({
      'fill' : 'none',
      'stroke' : PATH_SELECT_COLOR,
      'stroke-linejoin' : 'round',
      'stroke-width': connectedPath.attr('stroke-width'),
      'stroke-dasharray' : connectedPath.attr('stroke-dasharray'),
    })
    if(fragmentedPath.attr('stroke-width') === 0){ //線幅が0の場合
      fragmentedPath.attr({
        'stroke-width': '2' ,
        'stroke-dasharray' : '3 3 10 3'
      })
    }
    circle.attr({
      'cx' : dpoint[j][1],
      'cy' : dpoint[j][2],
      'r' : CIRCLE_RADIUS/(2 * draw.viewbox().zoom),
      'fill': CIRCLE_COLOR
    })
    if(j === 0){
      fragmentedPath.addClass('first_fragmentedPath');
      circle.addClass('first_circle');
    }
    if(j===dpoint.length - 2) fragmentedPath.addClass('last_fragmentedPath');
    if(dpoint[j+1][0]==="Z"){  //次の要素がZ要素である場合
      fragmentedPath.M({x: dpoint[j][1], y: dpoint[j][2]}).L({x: dpoint[0][1], y: dpoint[0][2]});
    }else{ //次の要素がZ要素でない場合
      fragmentedPath.M({x: dpoint[j][1], y: dpoint[j][2]}).L({x: dpoint[j+1][1], y: dpoint[j+1][2]});
      if(j === dpoint.length -2){
        let circle = fragmented_CircleGroup.circle().addClass('edit_circle').addClass('last_circle').front(); ////重ね順を一番前に
        circle.attr({
          'cx' : dpoint[j+1][1],
          'cy' : dpoint[j+1][2],
          'r' : CIRCLE_RADIUS/(2 * draw.viewbox().zoom),
          'fill': CIRCLE_COLOR,
        })
      }
    }
  }
  if(fragmented_PathGroup.hasClass('close')){
    let ghost_path = draw.path().attr({
      'id' : 'ghost_path_' + String(max_frag_num + 1),
      'fill' : connectedPath.attr('fill'),
      'fragmented_Group_Number' : String(max_frag_num + 1),
      'class' : 'ghost_path'
    });
    fragmented_PathGroup.before(ghost_path);
  }
  update_ghostPath();
}

/********************************************
//frag_pathのidの更新と選択用circleの追加
*********************************************/
function update_editElement(){
  draw.select('.fragmented_PathGroup').each(function(i , children){
    if(this.children().length === 0){
      let fragmented_Group_Number = this.attr('fragmented_Group_Number');
      SVG.get('#fragmented_CircleGroup_' + String(fragmented_Group_Number)).remove();
      if(this.parent().hasClass('close')) SVG.get('#ghost_path_' + String(fragmented_Group_Number)).remove();
      this.remove();
    }
  })
  draw.select('.first_fragmentedPath').removeClass('first_fragmentedPath');
  draw.select('.last_fragmentedPath').removeClass('last_fragmentedPath');
  draw.select('.fragmented_PathGroup').each(function(i , children){
    let fragmented_Group_Number = this.attr('fragmented_Group_Number');
    let self = this;
    this.each(function(j , children){
      this.attr({
        'id' : 'path_' + String(fragmented_Group_Number) + '_' + String(j),
        'assignment_Number': String(j),
      })
      if(j===0) this.addClass('first_fragmentedPath');
      if(j===self.children().length - 1) this.addClass('last_fragmentedPath');
    })
  })
  draw.select('.first_circle').removeClass('first_circle');
  draw.select('.last_circle').removeClass('last_circle');
  draw.select('.fragmented_CircleGroup').each(function(i , children){
    let fragmented_Group_Number = this.attr('fragmented_Group_Number');
    let self = this;
    this.each(function(j , children){
      this.attr({
        'id' : 'circle_' + String(fragmented_Group_Number) + '_' + String(j),
        'assignment_Number': String(j),
      })
      if(j===0) this.addClass('first_circle');
      if(j===self.children().length - 1) this.addClass('last_circle');
    })
  })
}

/*****************************************
//パスのイベントの登録
****************************************/
function fragmentedPath_EventSet(){
  let clickCount = 0;
  draw.select('.fragmented').off('mousedown').on('mousedown',function(e){ //mousedownイベントの登録
    editpath_hover(false);
    if(!input_key_buffer[16] && !this.hasClass('editing_target') && event.button===0) reset_editing_target();
    this.attr({ 'stroke' : PATH_EDIT_COLOR}).addClass('editing_target');
    if(e.button===0){ //左クリック時
      // シングルクリックの場合
      if( !clickCount ) {
        move_editing();
        ++clickCount ;
        setTimeout( function() {
          clickCount = 0 ;
        }, 350 ) ;
      // ダブルクリックの場合
      }else{
        let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
        let assignment_Number = this.attr('assignment_Number');
        let fragmentedPath1 = draw.path().M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: mx, y: my }).addClass('fragmented').addClass('SVG_Element').addClass('path');
        let fragmentedPath2 = draw.path().M({x: mx, y: my}).L({x: dpoint[1][1], y: dpoint[1][2] }).addClass('fragmented').addClass('SVG_Element').addClass('path');
        let circle = SVG.get('#fragmented_CircleGroup_' + String(this.parent().attr('fragmented_Group_Number'))).circle().addClass('edit_circle').back();
        fragmentedPath1.attr({
          'fill' : 'none',
          'stroke' : PATH_SELECT_COLOR,
          'stroke-linejoin' : 'round',
          'stroke-width': this.attr('stroke-width'),
          'stroke-dasharray': this.attr('stroke-dasharray'),
        })
        fragmentedPath2.attr({
          'fill' : 'none',
          'stroke' : PATH_SELECT_COLOR,
          'stroke-linejoin' : 'round',
          'stroke-width': this.attr('stroke-width'),
          'stroke-dasharray': this.attr('stroke-dasharray'),
        })
        circle.attr({
          'cx' : mx,
          'cy' : my,
          'r' : CIRCLE_RADIUS/(2 * draw.viewbox().zoom),
          'fill': CIRCLE_COLOR,
        })
        this.after(fragmentedPath2).after(fragmentedPath1);
        for(let i=0; i < Number(assignment_Number) + 1; i++) circle.forward();
        this.remove();
        update_editElement();
        fragmentedPath_EventSet();
        edit_circle_EventSet();
        editpath_hover(true);
        clickCount = 0;
      }
    }
  })
}

/****************************************
//circleのイベント登録
*****************************************/
function edit_circle_EventSet(){
  draw.select('.edit_circle').off('mousedown').on('mousedown',function(e){ //mousedownイベントの登録
    editpath_hover(false);
    if(!input_key_buffer[16] && !this.hasClass('editing_target') && event.button===0)  reset_editing_target();
    this.attr({ 'fill' : CIRCLE_EDIT_COLOR}).addClass('editing_target');
    if(e.button===0){
      move_editing();
      get_node_connectCircle();
    }
  })
}

/****************************************
//fragmentedPath、edit_circleの移動関数
*****************************************/
function move_editing(){
  cash_svg(); //svgデータのcash
  let init_x = mx, init_y = my; //クリックを行った点
  if(input_key_buffer[17]) editpath_mousemove('90degree',init_x,init_y);
  arrIntervalCnt.push($interval_move = setInterval(function(e){
        draw.select('.editing_target').each(function(i,children){
          if(this.hasClass('edit_circle')){
            let original_cx = this.attr('cx') , original_cy = this.attr('cy'); //クリックを行った点
            let cx = original_cx + mx - init_x , cy = original_cy + my - init_y;
            this.attr({'cx':cx}) , this.attr({'cy':cy}); //円の位置を格納
            let nears = getSimultaneouslyEdit_element(this);
            if(nears.beforePath){
              let dpoint = nears.beforePath.clear().array().settle(); //pathのdpoint配列を取得
              nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: cx, y: cy});
            }
            if(nears.afterPath){
              let dpoint = nears.afterPath.clear().array().settle(); //pathのdpoint配列を取得
              nears.afterPath.attr({'d':''}).M({x: cx, y: cy}).L({x: dpoint[1][1], y: dpoint[1][2]});
            }
          }else{
            let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
            let original_x1 = dpoint[0][1] , original_y1 = dpoint[0][2];
            let original_x2 = dpoint[1][1] , original_y2 = dpoint[1][2];
            let x1 = original_x1 - init_x + mx , y1 = original_y1 - init_y + my;
            let x2 = original_x2 - init_x + mx , y2 = original_y2 - init_y + my;
            this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
            let nears = getSimultaneouslyEdit_element(this);
            if(nears.beforeCircle) nears.beforeCircle.attr({'cx':x1,'cy':y1});
            if(nears.afterCircle) nears.afterCircle.attr({'cx':x2,'cy':y2});
            if(nears.beforePath){
              let dpoint = nears.beforePath.clear().array().settle();
              nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
            }
            if(nears.afterPath){
              let dpoint = nears.afterPath.clear().array().settle();
              nears.afterPath.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
            }
          }
        })
        update_ghostPath();
        init_x = mx , init_y = my;
      }, //インターバルする関数の中身終了
    20) //時間周期
  )
}

function delete_editpath(){
  while(draw.select('.editing_target').first()){
    let editing_target = draw.select('.editing_target').first();
    if(editing_target.hasClass('edit_circle')){
      let nears = getSimultaneouslyEdit_element(editing_target); //circleの近傍要素を取得
      let new_fragmentedPath;
      if(nears.afterPath)afterPath_dpoint =  nears.afterPath.clear().array().settle(); //afterPathのdpoint配列を取得
      if(nears.beforePath)beforePath_dpoint =  nears.beforePath.clear().array().settle(); //beforePathのdpoint配列を取得
      if(nears.afterPath && nears.beforePath){
        new_fragmentedPath = draw.path().M({x: beforePath_dpoint[0][1], y: beforePath_dpoint[0][2]}).L({x: afterPath_dpoint[1][1], y: afterPath_dpoint[1][2]});
        new_fragmentedPath.addClass('fragmented').addClass('SVG_Element').addClass('path');
        new_fragmentedPath.attr({
          'fill' : 'none',
          'stroke' : PATH_SELECT_COLOR,
          'stroke-linejoin' : 'round',
          'stroke-width': nears.beforePath.attr('stroke-width'),
          'stroke-dasharray': nears.beforePath.attr('stroke-dasharray'),
        })
        nears.beforePath.after(new_fragmentedPath);
      }
      if(nears.beforePath!==null)nears.beforePath.remove(); //beforePathの削除
      if(nears.afterPath!==null)nears.afterPath.remove();  //afterPathの削除
      let fragmented_PathGroup = SVG.get('fragmented_PathGroup_' + String(editing_target.parent().attr('fragmented_Group_Number')));
      if(fragmented_PathGroup.hasClass('close') && fragmented_PathGroup.children().length < 3){ //線が閉じていて、グループ内に線が2本以下の場合
        fragmented_PathGroup.removeClass('close');
        editing_target.parent().removeClass('close');
        SVG.get('#ghost_path_' + String(editing_target.parent().attr('fragmented_Group_Number'))).remove();
        new_fragmentedPath.remove();
      }
      editing_target.remove(); //editing_circleの削除
    }else{
      if(!editing_target.parent().hasClass('close')){
        var max_fragmented_Group_Number = getMax_fragmented_Group_Number();
        let new_fragmented_PathGroup = draw.group().addClass('fragmented_PathGroup');
        let new_fragmented_CircleGroup = draw.group().addClass('fragmented_CircleGroup');
        let current_fragmented_Group_Number = editing_target.parent().attr('fragmented_Group_Number');
        new_fragmented_PathGroup.attr({
          'id' : 'fragmented_PathGroup_' + String(max_fragmented_Group_Number + 1),
          'fragmented_Group_Number' : String(max_fragmented_Group_Number + 1),
          'connected_id' : editing_target.parent().attr('connected_id'),
          'fill_tmp': editing_target.parent().attr('fill_tmp')
        })
        new_fragmented_CircleGroup.attr({
          'id' : 'fragmented_CircleGroup_' + String(max_fragmented_Group_Number + 1),
          'fragmented_Group_Number' : String(max_fragmented_Group_Number + 1),
        })
        editing_target.parent().before(new_fragmented_PathGroup);
        for(var j=0 ; j < Number(editing_target.attr('assignment_Number')) + 1; j++){
          new_fragmented_PathGroup.add(SVG.get('path_'+ String(current_fragmented_Group_Number) + '_'  + String(j)));
          new_fragmented_CircleGroup.add(SVG.get('circle_'+ String(current_fragmented_Group_Number) + '_' + String(j)));
        }
      }else{
        let current_fragmented_Group_Number = editing_target.parent().attr('fragmented_Group_Number');
        for(var j=0 ; j < Number(editing_target.attr('assignment_Number')) + 1; j++){
          SVG.get('path_'+ String(current_fragmented_Group_Number) + '_'  + String(j)).front();
          SVG.get('circle_'+ String(current_fragmented_Group_Number) + '_'  + String(j)).front();
        }
        editing_target.parent().removeClass('close');
        let ghost_path = SVG.get('#ghost_path_' + String(current_fragmented_Group_Number));
        let fragmented_CircleGroup = SVG.get('fragmented_CircleGroup_'+ String(current_fragmented_Group_Number));
        if(fragmented_CircleGroup) fragmented_CircleGroup.removeClass('close');
        if(ghost_path) ghost_path.remove();
      }
      editing_target.remove(); //editing_pathの削除
    }
    update_editElement();
  }
  fragmentedPath_EventSet();
  edit_circle_EventSet();
  update_ghostPath();
  editpath_hover(true); //hoverイベントの再更新
}

/****************************************
//ノード結合関数
*****************************************/
function node_connect_function(){
  let connectCircle = get_node_connectCircle();
  let circle1 = connectCircle.circle1 , circle2 = connectCircle.circle2;
  if(circle1 && circle2){
    cash_svg(); //svgデータのcash
    let fragmented_PathGroup1 = SVG.get('#fragmented_PathGroup_' + circle1.parent().attr('fragmented_Group_Number'));
    let fragmented_PathGroup2 = SVG.get('#fragmented_PathGroup_' + circle2.parent().attr('fragmented_Group_Number'));
    let fragmented_CircleGroup1 = circle1.parent();
    let fragmented_CircleGroup2 = circle2.parent();
    let connect_flag1 , connect_flag2;
    if(circle1.hasClass('first_circle')){
      connect_flag1 = 'first';
    }else{
      connect_flag1 = 'last';
    }
    if(circle2.hasClass('first_circle')){
      connect_flag2 = 'first';
    }else{
      connect_flag2 = 'last';
    }
    let new_path = draw.path().addClass('fragmented').addClass('SVG_Element').addClass('path');
    new_path.attr({
      'fill' : 'none',
      'stroke' : PATH_SELECT_COLOR,
      'stroke-linejoin' : 'round',
      'stroke-width': fragmented_PathGroup1.first().attr('stroke-width'),
      'stroke-dasharray': fragmented_PathGroup1.first().attr('stroke-dasharray'),
    })
    if(fragmented_PathGroup1 === fragmented_PathGroup2){
      if(circle1.hasClass('first')){
        new_path.M({x: circle1.cx(), y: circle1.cy()}).L({x: circle2.cx(), y: circle2.cy()});
      }else{
        new_path.M({x: circle2.cx(), y: circle2.cy()}).L({x: circle1.cx(), y: circle1.cy()});
      }
      fragmented_PathGroup1.add(new_path);
      new_path.front();
      fragmented_PathGroup1.addClass('close');
      fragmented_CircleGroup1.addClass('close');
    }else{
      if(connect_flag1 === 'first' && connect_flag2 === 'first'){ //先端同士の場合
        new_path.M({x: circle1.cx(), y: circle1.cy()}).L({x: circle2.cx(), y: circle2.cy()});
        fragmented_PathGroup2.add(new_path);
        new_path.back();
        fragmented_PathGroup1.each(function(j , children){
          var dpoint = this.clear().array().settle();
          this.attr({ 'd' : 'M' + dpoint[1][1] + ' ' + dpoint[1][2] + 'L' + dpoint[0][1] + ' ' + dpoint[0][2] });
          fragmented_PathGroup2.add(this);
          this.back();
        })
        fragmented_CircleGroup1.each(function(j,children){
          fragmented_CircleGroup2.add(this);
          this.back();
        })
      }else if(connect_flag1 === 'first' && connect_flag2 === 'last'){
        new_path.M({x: circle2.cx(), y: circle2.cy()}).L({x: circle1.cx(), y: circle1.cy()});
        fragmented_PathGroup2.add(new_path);
        new_path.front();
        fragmented_PathGroup1.each(function(j , children){
          fragmented_PathGroup2.add(this);
          this.front();
        })
        fragmented_CircleGroup1.each(function(j,children){
          fragmented_CircleGroup2.add(this);
          this.front();
        })
      }else if(connect_flag1 === 'last' && connect_flag2 === 'first'){
        new_path.M({x: circle1.cx(), y: circle1.cy()}).L({x: circle2.cx(), y: circle2.cy()});
        fragmented_PathGroup1.add(new_path);
        new_path.front();
        fragmented_PathGroup2.each(function(j , children){
          fragmented_PathGroup1.add(this);
          this.front();
        })
        fragmented_CircleGroup2.each(function(j,children){
          fragmented_CircleGroup1.add(this);
          this.front();
        })
      }else{
        new_path.M({x: circle2.cx(), y: circle2.cy()}).L({x: circle1.cx(), y: circle1.cy()});
        fragmented_PathGroup2.add(new_path);
        new_path.front();
        let last_Path2 = fragmented_PathGroup2.last();
        let last_Circle2 = fragmented_CircleGroup2.last();
        fragmented_PathGroup1.each(function(j , children){
          var dpoint = this.clear().array().settle();
          this.attr({ 'd' : 'M' + dpoint[1][1] + ' ' + dpoint[1][2] + 'L' + dpoint[0][1] + ' ' + dpoint[0][2] });
          last_Path2.after(this);
        })
        fragmented_CircleGroup1.each(function(j , children){
          last_Circle2.after(this);
        })
      }
    }
    update_editElement();
    edit_circle_EventSet();
    fragmentedPath_EventSet();
    editpath_hover(true); //hoverイベントの再更新
    get_node_connectCircle();
    reset_editing_target();
  }
}

function get_node_connectCircle(){
  let edge_circle_num = 0;
  let ob = new Object();
  draw.select('.editing_target').each(function(i , children){
    if(this.hasClass('first_circle') || this.hasClass('last_circle')){
      if(!this.parent().hasClass('close')){
        if(edge_circle_num === 0){
          ob.circle1 = this;
          edge_circle_num++;
        }else if(edge_circle_num === 1){
          if(ob.circle1.parent() !== this.parent()){
            ob.circle2 = this;
            edge_circle_num++;
          }else{
            if(this.parent().children().length > 2){
              ob.circle2 = this;
              edge_circle_num++;
            }
          }
        }
      }
    }
  })
  if(ob.circle1 && ob.circle2){
    $('#node_connect').css('cursor','pointer');
    $('#node_connect').css('background-color','#E2EDF9');
    $('#node_connect').css('border-color','orange');
    $('#node_connect').hover(function() {
      $(this).css('background', '#31A9EE');
    }, function() {
      $(this).css('background', '#E2EDF9');
    });
    $('#node_connect').prop("disabled", false);
  }else{
    $('#node_connect').css('cursor','default');
    $('#node_connect').css('background-color','#C0C0C0');
    $('#node_connect').css('color','#000000');
    $('#node_connect').css('border-color','#696969');
    $('#node_connect').off('mouseenter mouseleave');
    $('#node_connect').prop("disabled", true);
  }
  return ob;
}

/***********************************************
//選択したpath,circleの前後要素を探索する関数
***********************************************/
function getSimultaneouslyEdit_element(element , dbclick){
  var fragmented_Group_Number = Number(element.parent().attr('fragmented_Group_Number'));
  var assignment_Number = Number(element.attr('assignment_Number'));
  var ob = new Object();
  if(element.hasClass('edit_circle')){
    ob.beforePath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(assignment_Number - 1)); //進行方向でpathの前にある円
    ob.afterPath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(assignment_Number)); //進行方向でpathの後にある円

    if(element.parent().hasClass('close') && element.hasClass('first_circle')){
      SVG.get('#fragmented_PathGroup_' + String(fragmented_Group_Number)).each(function(i,children){
        if(this.hasClass('last_fragmentedPath') && !this.hasClass('first_fragmentedPath'))ob.beforePath = this;
      })
    }
  }else{
    ob.beforeCircle = SVG.get('circle_' + String(fragmented_Group_Number) + '_' + String(assignment_Number)); //進行方向でpathの前にある円
    ob.afterCircle = SVG.get('circle_' + String(fragmented_Group_Number) + '_' + String(assignment_Number + 1)); //進行方向でpathの後にある円
    ob.beforePath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(assignment_Number - 1)); //進行方向でpathの前にある円
    ob.afterPath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(assignment_Number + 1)); //進行方向でpathの後にある円
    if(element.parent().hasClass('close')){
      if(element.hasClass('last_fragmentedPath')){
        ob.afterCircle = SVG.get('circle_' + String(fragmented_Group_Number) + '_' + String(0)); //進行方向で円の後にある円
        ob.afterPath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(0));
      }else if(element.hasClass('first_fragmentedPath')){
        SVG.get('fragmented_PathGroup_' + String(fragmented_Group_Number)).each(function(i,children){
          if(this.hasClass('last_fragmentedPath'))ob.beforePath = this;
        })
      }
    }
  }
  if(!dbclick){
    if(ob.beforeCircle){
      if(ob.beforeCircle.hasClass('editing_target')) ob.beforeCircle = null;
    }
    if(ob.afterCircle){
      if(ob.afterCircle.hasClass('editing_target')) ob.afterCircle = null;
    }
    if(ob.beforePath){
      if(ob.beforePath.hasClass('editing_target')) ob.beforePath = null;
    }
    if(ob.afterPath){
      if(ob.afterPath.hasClass('editing_target')) ob.afterPath = null;
    }
  }
  return ob;
}

/****************************************
//垂直化
*****************************************/
function verhor_fragmentedPath(){
  cash_svg(); //svgデータのcash
  draw.select('.editing_target').each(function(i,children){
    if(!this.hasClass('edit_circle')){
      var dpoint = this.clear().array().settle();
      var x1 = dpoint[0][1] , y1 = dpoint[0][2];
      var x2 = dpoint[1][1] , y2 = dpoint[1][2];
      var line_rad = Math.atan( Math.abs(y2 - y1 )/Math.abs(x2 - x1) );
      if(line_rad * 180/Math.PI < 45){
        y2 = y1;
      }else{
        x2 = x1;
      }
      this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
      var nears = getSimultaneouslyEdit_element(this , true);
      if(nears.beforeCircle) nears.beforeCircle.attr({ 'cx' : x1 , 'cy' : y1 });
      if(nears.afterCircle) nears.afterCircle.attr({ 'cx' : x2 , 'cy' : y2 });
      if(nears.beforePath){
        var dpoint = nears.beforePath.clear().array().settle(); //pathのdpoint配列を取得
        nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
      }
      if(nears.afterPath){
        var dpoint = nears.afterPath.clear().array().settle(); //pathのdpoint配列を取得
        nears.afterPath.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
      }
      update_ghostPath();
    }
  })
  reset_editing_target();
}

/****************************************
//ghost_pathの更新
*****************************************/
function update_ghostPath(){
  draw.select('.ghost_path').each(function(i , children){
    let ghost_path = this;
    ghost_path.attr({'d' : ''});
    let fragmented_Group_Number = ghost_path.attr('fragmented_Group_Number');
    let fragmented_PathGroup = SVG.get('#fragmented_PathGroup_' + fragmented_Group_Number);
    if(fragmented_PathGroup.hasClass('close')){
      fragmented_PathGroup.each(function(i , children){
        let dpoint = this.clear().array().settle() //pathのdpoint配列を取得
        if(i===0){
          ghost_path.M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: dpoint[1][1], y: dpoint[1][2]})
        }else{
          ghost_path.L({x: dpoint[0][1], y: dpoint[0][2]}).L({x: dpoint[1][1], y: dpoint[1][2]})
        }
      })
      ghost_path.Z();
    }else{
      ghost_path.remove();
    }
  })
}

function reset_editing_target(){
  draw.select('.editing_target').each(function(i,children){
    this.removeClass('editing_target');
    if(this.hasClass('edit_circle')){
      this.attr({ 'fill' : CIRCLE_COLOR});
    }else{
      this.attr({ 'stroke' : PATH_SELECT_COLOR});
    }
  })
}

function getMax_fragmented_Group_Number(){
  let max_fragmented_Group_Number = -1;
  draw.select('.fragmented_PathGroup').each(function(i, children) {
    if(max_fragmented_Group_Number < this.attr('fragmented_Group_Number')) max_fragmented_Group_Number = this.attr('fragmented_Group_Number');
  })
  return max_fragmented_Group_Number;
}
