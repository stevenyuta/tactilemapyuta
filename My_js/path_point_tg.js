function fig_straight(){
  var thre_angle_max = Math.tan( 85 * (Math.PI/180) ); //垂直線だと判定するための閾値
  var thre_angle_min = Math.tan( 5 * (Math.PI/180) ); //平行線だと判定するための閾値
  draw.select('.edit_select.connected , .segmented').each(function(i , children){
    var attr_d = '';
    var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
    for(var j=0; j < dpoint.length - 1; j++){
      if(dpoint[j + 1][0] !== 'Z'){
        var path_x1_base = Number( dpoint[j][1]);
        var path_y1_base = Number( dpoint[j][2]);
        var path_x2_base = Number( dpoint[j + 1][1]);
        var path_y2_base = Number( dpoint[j + 1][2]);
      }else{
        var path_x1_base = Number( dpoint[j][1]);
        var path_y1_base = Number( dpoint[j][2]);
        var path_x2_base = Number( dpoint[0][1]);
        var path_y2_base = Number( dpoint[0][2]);
      }
      var tan = Math.abs(path_y2_base-path_y1_base) / Math.abs(path_x2_base - path_x1_base); //対象の直線の傾きを求める
      if(tan > thre_angle_max || tan < thre_angle_min ){
        if(tan > thre_angle_max) path_x1_base = path_x2_base;
        if(tan < thre_angle_min) path_y1_base = path_y2_base;
      }
      attr_d += dpoint[j][0] + ' ' + path_x1_base + ' ' +  path_y1_base + ' ';
      if(j===dpoint.length - 2){
        if(dpoint[j + 1][0] === 'Z'){
          attr_d += 'Z ';
        }else{
        attr_d += dpoint[j + 1][0] + ' ' + path_x2_base + ' ' +  path_y2_base + ' ';
        }
      }
    }
    this.attr({'d' : attr_d});
    if(this.hasClass('segmented')){ //segmented パスの場合
      let dpoint = this.clear().array().settle();
      let x1 = Number(dpoint[0][1]) , y1 = Number(dpoint[0][2]);
      let x2 = Number(dpoint[1][1]) , y2 = Number(dpoint[1][2]);
      let nears = get_nears(this);
      if(nears.beforeNode) nears.beforeNode.attr({'x':x1 - nears.beforeNode.width()/2,'y':y1 - nears.beforeNode.height()/2});
      if(nears.afterNode) nears.afterNode.attr({'x':x2 - nears.afterNode.width()/2,'y':y2 - nears.afterNode.height()/2});
      if(nears.beforeSegment){
        let dpoint = nears.beforeSegment.clear().array().settle();
        nears.beforeSegment.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
      }
      if(nears.afterSegment){
        let dpoint = nears.afterSegment.clear().array().settle();
        nears.afterSegment.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
      }
    }
  })
}

function fig_connect(){
  var thre_xy = 5;
  var thre_distance = 5;
  draw.select('.edit_select.connected,.segmented').each(function(i , children){
    var dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
    for(var j=0; j < dpoint.length - 1; j++){
      if(dpoint[j + 1][0] !== 'Z'){
        var path_x1_base = Number( dpoint[j][1]);
        var path_y1_base = Number( dpoint[j][2]);
        var path_x2_base = Number( dpoint[j + 1][1]);
        var path_y2_base = Number( dpoint[j + 1][2]);
      }else{
        var path_x1_base = Number( dpoint[j][1]);
        var path_y1_base = Number( dpoint[j][2]);
        var path_x2_base = Number( dpoint[0][1]);
        var path_y2_base = Number( dpoint[0][2]);
      }

      var relativeXY = get_relativeXY(path_x1_base ,path_y1_base, path_x2_base , path_y2_base , thre_xy); //直線の領域のx,y座標
      var line_param = getLineParam(path_x1_base , path_y1_base , path_x2_base , path_y2_base);

      draw.select('.edit_select.connected,.segmented').each(function(k , children){
        var attr_d = '';
        var dpoint_select = this.clear().array().settle(); //pathのdpoint配列を取得
        for(var l=0; l < dpoint_select.length; l++){
          if(dpoint_select[l][0] !== 'Z'){
            var path_x1 = Number( dpoint_select[l][1] )
            var path_y1 = Number( dpoint_select[l][2] )


            var distance = Math.abs(line_param.a * path_x1 + line_param.b * path_y1 + line_param.c)/Math.sqrt(line_param.a * line_param.a + line_param.b * line_param.b);
            if(distance < thre_distance  && path_x1 > relativeXY.min_x && path_x1 < relativeXY.max_x && path_y1 > relativeXY.min_y && path_y1 < relativeXY.max_y){
              var straight_change_x = (line_param.b * line_param.b * path_x1 - line_param.a * line_param.b * path_y1 - line_param.a * line_param.c)/(line_param.a * line_param.a + line_param.b * line_param.b);
              var straight_change_y =  - (line_param.a * line_param.b * path_x1 - line_param.a * line_param.a * path_y1 + line_param.b * line_param.c)/(line_param.a * line_param.a + line_param.b * line_param.b);
              if(straight_change_x < (relativeXY.min_x + thre_xy) ){
                straight_change_x = relativeXY.min_x + thre_xy;
              }
              if(straight_change_x > (relativeXY.max_x - thre_xy) ){
                straight_change_x = relativeXY.max_x - thre_xy;
              }
              if(straight_change_y < (relativeXY.min_y + thre_xy) ){
                straight_change_y = relativeXY.min_y + thre_xy;
              }
              if(straight_change_y > (relativeXY.max_y - thre_xy) ){
                straight_change_y = relativeXY.max_y - thre_xy;
              }
            }else{
              var straight_change_x = path_x1
              var straight_change_y = path_y1
            }

            attr_d += dpoint_select[l][0] + ' ' + straight_change_x + ' ' + straight_change_y + ' '

          }else{
            attr_d += 'Z '
          }
        }
        this.attr({ 'd' : attr_d });
        if(this.hasClass('segmented')){ //segmented パスの場合
          let dpoint = this.clear().array().settle();
          let x1 = Number(dpoint[0][1]) , y1 = Number(dpoint[0][2]);
          let x2 = Number(dpoint[1][1]) , y2 = Number(dpoint[1][2]);
          let nears = get_nears(this);
          if(nears.beforeNode) nears.beforeNode.attr({'x':x1 - nears.beforeNode.width()/2,'y':y1 - nears.beforeNode.height()/2});
          if(nears.afterNode) nears.afterNode.attr({'x':x2 - nears.afterNode.width()/2,'y':y2 - nears.afterNode.height()/2});
        }
      })
    }
  })
}

function fig_pathUpload(){
  //描画中の線の更新
  if(SVG.get('#' + now_drawing_path_ID)){
    drawing_path = SVG.get('#' + now_drawing_path_ID);
    let dpoint = drawing_path.clear().array().settle();
    current_x = dpoint[dpoint.length-1][1];
    current_y = dpoint[dpoint.length-1][2];
    drawing_path_dpoint="";
    for(let i=0; i < dpoint.length-1; i++){
      drawing_path_dpoint += dpoint[i][0] +" "+ dpoint[i][1] + " " + dpoint[i][2];
    }
    set_closePathNode();
  }
  //線の詳細編集の更新
  draw.select('.Segments_Group').each(function(i,children){
    let segmented_Group_Number = this.attr('segmented_Group_Number');
    let closed;
    this.hasClass('closed_path') ? closed = true : closed = false;
    this.each(function(j,children){
      let assignment_Number = Number(this.attr('assignment_Number'));
      let dpoint = this.clear().array().settle();
      let rect_id = 'rect_' + segmented_Group_Number + '_' + assignment_Number;
      let rect = SVG.get(rect_id);
      rect.attr({
        'x' : dpoint[0][1] - rect.width()/2,
        'y' : dpoint[0][2] - rect.height()/2
      })
      if(!closed){ //閉じていないpathの場合
        let rect_id = 'rect_' + segmented_Group_Number + '_' + (assignment_Number + 1);
        let rect = SVG.get(rect_id);
        rect.attr({
          'x' : dpoint[1][1] - rect.width()/2,
          'y' : dpoint[1][2] - rect.height()/2
        })
      }
    })
  })
  update_fill_path();
}
