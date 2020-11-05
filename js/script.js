/**
 * ownCloud - codimd
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hugo Gonzalez Labrador (CERN) <hugo.gonzalez.labrador@cern.ch>
 * @copyright Hugo Gonzalez Labrador (CERN) 2017
 */

(function($, OC, OCA) { // just put CodiMD in global namespace so 

    var iFrame = true;

    OCA.CodiMD = {};

    var defaultMimes = [
        'text/markdown'
    ]

    var codimdApp;

    var loadConfig = function() {
        // For now just use the endpoints provided by wopi
        var url = OC.generateUrl('/apps/wopiviewer/config');
        $.get(url).success(function(response) {
                try {
                    codimdApp = response['.md'];
                    loadPublicLink();
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

        var canedit = false;
        var permissions = data.$file.attr("data-permissions");
        if (permissions > 1) { // > 1 write permissions
            canedit = true;
        }
        filename = data.dir + "/" + basename;

        _open(filename, canedit, false);
    };


    var _open = function(filename, canedit, forceIFrame) {

        var data = { filename: filename };
        var url = "";
        // check if we are on a public page
        if (isPublicPage()) {
            var token = getSharingToken();
            url = OC.generateUrl('/apps/wopiviewer/publicopen');
            data['token'] = token;
            data['folderurl'] = parent.location.protocol + '//' + location.host + OC.generateUrl('/s/') + token + '?path=' + OC.dirname(data.filename);
        } else {
            url = OC.generateUrl('/apps/wopiviewer/open');
            data['folderurl'] = parent.location.protocol + '//' + location.host + OC.generateUrl('/apps/files/?dir=' + OC.dirname(data.filename));
        }

        $.post(url, data).success(function(response) {
            if (response.wopi_src) {

                var open_url = (canedit ? codimdApp.edit : codimdApp.view) + "?WOPISrc=" + encodeURI(response.wopi_src);

                if (forceIFrame || iFrame) {
                    setView(open_url);
                } else {
                    window.open(open_url, '_blank');
                }

            } else {
                console.error(response.error);
            }
        });
    }

    var setView = function(actionURL) {
        var view = `<div id="office_container"><span id="frameholder"><div id="codimd_close" style="
		z-index: 200;
		position: absolute;
		display: inline-block;
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

        $("#codimd_close").on('click', function() {
            office_frame.src = "about:blank"; // force redirect so that the page knows it closed?
            $("#office_container").remove();
            $('#preview').show();
        });
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
        loadConfig();

        if (OCA.Files != null) {
            for (i = 0; i < defaultMimes.length; ++i) {
                OCA.Files.fileActions.register(defaultMimes[i], 'Open in CodiMD', OC.PERMISSION_READ, OC.imagePath('codimd', 'app.svg'), sendOpen);
                OCA.Files.fileActions.setDefault(defaultMimes[i], 'Open in CodiMD');
            }
        }


        OC.Plugins.register("OCA.Files.NewFileMenu", {
            attach: function(menu) {
                var fileList = menu.fileList;

                if (fileList.id !== "files") {
                    return;
                }

                menu.addMenuEntry({
                    id: "md",
                    displayName: t(OCA.Collabora.AppName, "CodiMD file (md)"),
                    templateName: 'New MD file.md',
                    iconClass: "icon-file",
                    fileType: "file",
                    actionHandler: function(name) {
                        fileList.createFile(name)
                            .then(function(status, data) {

                                var row = OC.Notification.show(t(OCA.Collabora.AppName, "File created"));
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

    });

})(jQuery, OC, OCA);