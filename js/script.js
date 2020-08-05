/**
 * ownCloud - codimd
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hugo Gonzalez Labrador (CERN) <hugo.gonzalez.labrador@cern.ch>
 * @copyright Hugo Gonzalez Labrador (CERN) 2017
 */

(function ($, OC, OCA) {	// just put CodiMD in global namespace so 
	
	OCA.CodiMD = {};

	var defaultMimes = [
		'text/markdown'
	]

	var codimdApp;

	var loadConfig = function() {
		// For now just use the endpoints provided by wopi
		var url = OC.generateUrl('/apps/wopiviewer/config');
		$.get(url).success(function (response) {
			try {
				codimdApp = response['.md'];
			} catch (error) {
				OC.Notification.showTemporary("Failed to load CodiMD");
				console.error('Failed to load CodiMD endpoint', error);
			}
		})
		.error(function (error) {
			OC.Notification.showTemporary("Failed to load CodiMD");
			console.error('Failed to load CodiMD endpoint', error);
		}); 
	}

	var isPublicPage = function () {

		if ($("input#isPublic") && $("input#isPublic").val() === "1") {
			return true;
		} else {
			return false;
		}
	};

	var getSharingToken = function () {
		if ($("input#sharingToken") && $("input#sharingToken").val()) {
			return $("input#sharingToken").val();
		} else {
			return null;
		}
	};

	var sendOpen = function (basename, data) {

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

		var data = {filename: filename};
		var url = "";
		// check if we are on a public page
		if (isPublicPage()) {
			var token = getSharingToken();
			url = OC.generateUrl('/apps/wopiviewer/publicopen');
			data['token'] = token;
			data['folderurl'] = parent.location.protocol+'//'+location.host+OC.generateUrl('/s/')+token+'?path='+OC.dirname(data.filename);
		} else {
			url = OC.generateUrl('/apps/wopiviewer/open');
			data['folderurl'] = parent.location.protocol+'//'+location.host+OC.generateUrl('/apps/files/?dir=' + OC.dirname(data.filename));
		}

		$.post(url, data).success(function (response) {
			if (response.wopi_src) {

				if (canedit) {
					window.open(codimdApp.edit + "?WOPISrc=" + encodeURI(response.wopi_src),'_blank');
				} else {
					window.open(codimdApp.view + "?WOPISrc=" + encodeURI(response.wopi_src),'_blank');
				}
				
			} else {
				console.error(response.error);
			}
		});
	};


	$(document).ready(function () {
		loadConfig();

		if (OCA.Files != null) {
			for (i = 0; i < defaultMimes.length; ++i) {
				OCA.Files.fileActions.register(defaultMimes[i], 'Open in CodiMD', OC.PERMISSION_READ, OC.imagePath('codimd', 'app.svg'), sendOpen);
				OCA.Files.fileActions.setDefault(defaultMimes[i], 'Open in CodiMD');
			}
		}


		OC.Plugins.register("OCA.Files.NewFileMenu", {
			attach: function (menu) {
				var fileList = menu.fileList;
	
				if (fileList.id !== "files") {
					return;
				}
	
				menu.addMenuEntry({
					id: "md",
					displayName: t(OCA.Collabora.AppName, "CodiMD file (md)"),
					templateName:  'New MD file.md',
					iconClass: "icon-file",
					fileType: "file",
					actionHandler: function (name) {
                        fileList.createFile(name)
                        .then(function(status, data) {

							var row = OC.Notification.show(t(OCA.Collabora.AppName, "File created"));
							setTimeout(function () {
								OC.Notification.hide(row);
							}, 3000);

							var selector = 'tr[data-file="'+ name +'"]';
							fileList.$container.find(selector).find("span.nametext").click();
						}, function() {
							OC.Notification.show(t('files', 'Could not create file "{file}"',
								{file: name}), {type: 'error'}
							);
						});
					}
				});
			}
		});

	});

})(jQuery, OC, OCA);
