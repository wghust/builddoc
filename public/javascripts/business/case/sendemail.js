$(document).ready(function() {
    Email = function() {
        _ethis = this;
        _ethis._email = "";
        _ethis._id = "";
        _ethis._isop = false;
    };
    Email.prototype = {
        _init: function() {
            _ethis._op();
        },
        _op: function() {
            $(".cemail").click(function() {
                if (_ethis._isop == false) {
                    _ethis._isop = true;
                    _ethis._getValue();
                    if (_ethis._email == "") {
                        alert("邮件为空");
                    } else {
                        if (_ethis._checkEmail()) {
                            _ethis._sendEmail();
                        } else {
                            alert("邮件格式错误");
                        }
                    }
                }
            });
        },
        _getValue: function() {
            _ethis._email = $(".case_email").val();
            _ethis._id = $(".cid").val();
        },
        _checkEmail: function() {
            var reMail = /^(?:\w+\.?)*\w+@(?:\w+\.?)*\w+$/;
            if (!reMail.test(_ethis._email)) {
                return false;
            }
            return true;
        },
        _sendEmail: function() {
            $(".cemail").text('发送中');
            $.ajax({
                url: '/case/sendmail',
                type: 'POST',
                dataType: 'json',
                data: {
                    email: _ethis._email,
                    caseid: _ethis._id
                },
                success: function(callback) {
                    var back = callback;
                    _ethis._isop = false;
                    if (back.state) {
                        alert("发送成功");
                    } else {
                        alert("发送失败");
                    }
                    $(".cemail").text('发邮件');
                }
            });
        }
    };
    var newEmail = new Email();
    newEmail._init();
});