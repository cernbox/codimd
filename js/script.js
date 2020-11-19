
(function($, OC, OCA) { // just put CodiMD in global namespace 

    OCA.CodiMD = {};

    var defaultMimes = [
        'text/markdown'
    ]

    var codimdApp;

    var loadConfig = function(to_execute) {
        // For now just use the endpoints provided by wopi
        var url = OC.generateUrl('/apps/wopiviewer/config');
        $.get(url).success(function(response) {
                try {
                    codimdApp = response['.md'];
                    to_execute();
                } catch (error) {
                    OC.Notification.showTemporary("Failed to load CodiMD");
                    console.error('Failed to load CodiMD endpoint', error);
                }
            })
            .error(function(error) {
                OC.Notification.showTemporary("Failed to load CodiMD");
                console.error('Failed to load CodiMD endpoint', error);
            });
    }

    var isPublicPage = function() {

        if ($("input#isPublic") && $("input#isPublic").val() === "1") {
            return true;
        } else {
            return false;
        }
    };

    var getSharingToken = function() {
        if ($("input#sharingToken") && $("input#sharingToken").val()) {
            return $("input#sharingToken").val();
        } else {
            return null;
        }
    };

    var sendOpen = function(basename, data) {

        if (!codimdApp) {
            OC.Notification.showTemporary("Failed to load CodiMD");
            console.error("CodiMD app still didn't load")
            return;
        }

        var path = 'view';
        var permissions = data.$file.attr("data-permissions");
        if (permissions > 1) { // > 1 write permissions
            path = 'edit';
        }
        filename = data.dir + "/" + basename;

        if (isPublicPage()) {
            var token = getSharingToken();
            url = OC.generateUrl('/apps/codimd/public/' + token + '/' + path + filename + '?X-Access-Token=' + getPublicLinkAccessToken());
        } else {
            url = OC.generateUrl('/apps/codimd/' + path + filename);
        }

        window.open(url, '_blank');
    };


    var _open = function(filename, canedit, iFrame) {

        var data = { filename: filename };
        var url = "";
        var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

        // the link is from a public page (but not a public link preview)
        if (typeof pl_token !== 'undefined') {
            url = OC.generateUrl('/apps/wopiviewer/publicopen');
            data['token'] = pl_token;
            data['folderurl'] = parent.location.protocol + '//' + location.host + OC.generateUrl('/s/') + pl_token + '?path=' + OC.dirname(data.filename);
            headers['X-Access-Token'] = getUrlParameter('X-Access-Token');
        } else if (isPublicPage()) {
            url = OC.generateUrl('/apps/wopiviewer/publicopen');
            var token = getSharingToken();
            data['token'] = token;
            data['folderurl'] = parent.location.protocol + '//' + location.host + OC.generateUrl('/s/') + token + '?path=' + OC.dirname(data.filename);
            headers['X-Access-Token'] = getPublicLinkAccessToken();
        } else {
            url = OC.generateUrl('/apps/wopiviewer/open');
            data['folderurl'] = parent.location.protocol + '//' + location.host + OC.generateUrl('/apps/files/?dir=' + OC.dirname(data.filename));
            headers['X-Access-Token'] = OC["X-Access-Token"];
        }

        // Use fetch instead of XMLHttpRequest to avoid having leftoverrs from OC...
        fetch(url, {
            method: 'POST',
            headers: headers,
            body: new URLSearchParams(data)
        }).then(response => response.json())
        .then(function(response) {
            if (response.wopi_src) {
                var open_url = (canedit ? codimdApp.edit : codimdApp.view) + "?WOPISrc=" + encodeURI(response.wopi_src);
                setView(open_url, iFrame);
            }
        }, function() {
            $('#loader').html('Failed to load the file. Does it exist?');
        });
    };

    var getPublicLinkAccessToken = function() {
        var data = $("data[key='cernboxauthtoken']");
        return data.attr('x-access-token');
    }

    var setView = function(actionURL, isEmbbedded) {

        var view = `<div id="office_container"><span id="frameholder"><div id="codimd_close" style="
            z-index: 200;
            position: absolute;
            display: none;
            top: 0;
            margin-top: 8px;
            right: 400px;
            font-weight: 400;
            text-align: center;
            -ms-touch-action: manipulation;
            touch-action: manipulation;
            cursor: pointer;
            background-image: none;
            border: 1px solid #ccc;
            padding: 6px 12px;
            font-size: 14px;
            line-height: 1.42857143;
            border-radius: 4px;
            background: #fff;
        ">⇽ &nbsp;Return</div></span></div>`;
        $('#content').append(view);

        var frameholder = document.getElementById('frameholder');
        var office_frame = document.createElement('iframe');
        office_frame.name = 'office_frame';
        office_frame.id = 'office_frame';
        // The title should be set for accessibility
        office_frame.title = 'CERNBox Office Online Frame';
        // This attribute allows true fullscreen mode in slideshow view
        // when using PowerPoint Online's 'view' action.
        office_frame.setAttribute('allowfullscreen', 'true');
        office_frame.src = actionURL;

        frameholder.appendChild(office_frame);
        $('#preview').hide();

        if (isEmbbedded) {
            $("#codimd_close").css('display', 'inline-block');
            $("#codimd_close").on('click', function() {
                office_frame.src = "about:blank"; // force redirect so that the page knows it closed?
                $("#office_container").remove();
                $('#preview').show();
            });
        }
    };

    var loadPublicLink = function() {

        if (!isPublicPage()) return;

        if (getUrlParameter('closed') === '1') return;

        var mime = $('#mimetype').val();
        var filename = $('#filename').val();

        defaultMimes.forEach(defaultmime => {
            if (mime === defaultmime) {
                _open(filename, false, true);
            }
        })


    }

    var getUrlParameter = function(sParam) {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(sParam)
    };


    $(document).ready(function() {

        loadConfig(function() {

            if (typeof open_file !== 'undefined') {
                if (this_app === "codimd") {
                    _open(open_file, open_file_type === "edit", false);
                }
            } else {

                loadPublicLink();

                if (OCA.Files != null) {
                    for (i = 0; i < defaultMimes.length; ++i) {
                        OCA.Files.fileActions.register(defaultMimes[i], 'Open in CodiMD', OC.PERMISSION_READ, OC.imagePath('codimd', 'app.svg'), sendOpen);
                        OCA.Files.fileActions.setDefault(defaultMimes[i], 'Open in CodiMD');
                    }

                    OC.Plugins.register("OCA.Files.NewFileMenu", {
                        attach: function(menu) {
                            var fileList = menu.fileList;

                            if (fileList.id !== "files") {
                                return;
                            }

                            menu.addMenuEntry({
                                id: "md",
                                displayName: t(OCA.CodiMD.AppName, "CodiMD file (md)"),
                                templateName: 'New MD file.md',
                                iconClass: "icon-file",
                                fileType: "file",
                                actionHandler: function(name) {
                                    fileList.createFile(name)
                                        .then(function(status, data) {

                                            var row = OC.Notification.show(t(OCA.CodiMD.AppName, "File created"));
                                            setTimeout(function() {
                                                OC.Notification.hide(row);
                                            }, 3000);

                                            var selector = 'tr[data-file="' + name + '"]';
                                            fileList.$container.find(selector).find("span.nametext").click();
                                        }, function() {
                                            OC.Notification.show(t('files', 'Could not create file "{file}"', { file: name }), { type: 'error' });
                                        });
                                }
                            });
                        }
                    });
                }
            }
        });
    });

})(jQuery, OC, OCA);