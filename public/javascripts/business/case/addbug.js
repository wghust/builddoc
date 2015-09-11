$(document).ready(function() {
    addBug = function() {
        _athis = this;
        _athis.bugimages = [];
    };
    addBug.prototype = {
        _init: function() {
            _athis._op();
        },
        _op: function() {
            $(".queshow").hover(function() {
                $(".showmsg").css({
                    'display': 'block'
                });
                $(".showmsg").animate({
                    'top': '20px',
                    'opacity': 1
                }, 400);
            }, function() {
                $(".showmsg").animate({
                    'top': '40px',
                    'opacity': 0
                }, 400, function() {
                    $(this).css({
                        'display': 'none'
                    });
                });
            });

            $(".addimage").click(function() {
                $(".bugimage").click();
            });

            $(".bugimage").change(function() {
                var file = $(".bugimage")[0].files[0];
                var fileName = file.name.substring(0, file.name.lastIndexOf('.'));
                var fileType = file.name.substring(file.name.lastIndexOf('.'), file.name.length);
                if (file == null) {
                    alert("请选择文件");
                } else {
                    if (_athis._checkFileType(fileType) == false) {
                        alert("文件格式错误");
                    } else {
                        _athis._beginUpload(file);
                    }
                }
            });

            $(".addbug").click(function() {
                _athis._addBug();
            });
        },
        _checkFileType: function(type) {
            var isRight = false;
            switch (type) {
                case '.png':
                case '.jpg':
                case '.gif':
                    isRight = true;
                    break;
                default:
                    isRight = false;
                    break;
            }
            return isRight;
        },
        _beginUpload: function(file) {
            var fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = function(e) {
                var fileType = file.name.substring(file.name.lastIndexOf('.'), file.name.length);
                var now = new Date();
                var fileName = now.getTime() + 'langting' + parseInt(Math.random() * 20) + fileType;
                console.log(fileName);
                // $(".bug_right .block_con").prepend("<img src='" + e.target.result + "' class='bugimageshow'>");
                $(".addimage").text("上传中...");
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/case/bugimage/add',
                    data: {
                        imageData: e.target.result,
                        caseid: $(".caseid").val(),
                        imageName: fileName
                    },
                    success: function(callback) {
                        var back = callback;
                        if (back.state == true) {
                            $(".addimage").text("上传成功");
                            $(".bug_right .block_con").append("<img src='" + back.imgurl + "' class='bugimageshow' data-name='" + back.imgname + "' data-hash='" + back.imghash + "'>");
                            var oneimage = {
                                name: back.imgname,
                                url: back.imgurl,
                                hash: back.imghash
                            };
                            _athis.bugimages.push(oneimage);
                            setTimeout(function() {
                                $(".addimage").text("添加图片");
                            }, 500);
                        } else {
                            alert("上传失败");
                        }
                    }
                });
            }
        },
        _addBug: function() {
            if ($(".bug_con").val() == "") {
                alert("请输入BUG");
            } else {
                var bug = {
                    caseid: $(".caseid").val(),
                    content: $(".bug_con").val(),
                    images: _athis.bugimages,
                    grade: parseInt($(".cradio:checked").val()),
                    term: $(".case_term").val(),
                    step: $(".case_step").val(),
                    result: $(".case_result").val(),
                    trueresult: $(".case_trueresult").val(),
                    rate: parseInt($(".crate:checked").val())
                };
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/case/bug/add',
                    data: bug,
                    success: function(callback) {
                        var back = callback;
                        if (back.state == true) {
                            alert("保存成功");
                            window.location.href = "/case/" + bug.caseid + "/list";
                        } else {
                            alert("保存失败");
                        }
                    }
                });
            }
        }
    };
    var newBug = new addBug();
    newBug._init();
});