$(document).ready(function() {
    var Luck = function() {
        _kthis = this;
        _kthis.obs = [];
    };
    Luck.prototype = {
        _init: function() {
            _kthis._op();
        },
        _op: function() {
            $(".oneob_list a").click(function() {
                $(".obs_div").css({
                    'display': "block"
                });
                $(".obs_div").animate({
                    'opacity': 1,
                    'margin-left': '5%'
                }, 1300, 'easeOutElastic');
            });

            $(".onepro").click(function() {
                var data = {
                    uid: $(this).data('freeuid'),
                    projectname: $(this).text()
                };
                $(".oneob_cli a").text("开始");
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/project/getObject',
                    data: data,
                    success: function(back) {
                        var nowObject = back.objects.objectname.split(/[;；]/);
                        _kthis.obs = nowObject;
                        $(".oneob_list a").data({
                            'freeuid': data.uid
                        });
                        $(".oneob_list a").text(data.projectname);
                        _kthis._slideOut();
                    }
                });
            });

            $(".oneob_cli a").click(function(e) {
                if ($(".oneob_list a").data('freeuid') == -1) {
                    alert("请选择项目");
                } else {
                    _kthis._beginShow();
                }
            });
        },
        _slideOut: function() {
            $(".obs_div").animate({
                'margin-left': '-50%',
                'opacity': 0
            }, 400, function() {
                $(this).hide();
            });
        },
        _getTimes: function() {
            var times = Math.floor(Math.random() * _kthis.obs.length + _kthis.obs.length / 2);
            return times;
        },
        _getNow: function() {
            var nowstrnum = Math.floor(Math.random() * _kthis.obs.length);
            return _kthis.obs[nowstrnum];
        },
        _beginShow: function() {
            var k = 0;
            var times = _kthis._getTimes();

            var s = setInterval(function() {
                if (k < times) {
                    $(".oneob_div span").text(_kthis._getNow());
                    k++;
                } else {
                    $(".oneob_cli a").text("已选过？");
                    clearInterval(s);
                }
            }, 100);
        }
    };
    var newLuck = new Luck();
    newLuck._init();
});