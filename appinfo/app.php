<?php
/**
 * ownCloud - codimd
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hugo Gonzalez Labrador (CERN) <hugo.gonzalez.labrador@cern.ch>
 * @copyright Hugo Gonzalez Labrador (CERN) 2017
 */

namespace OCA\CodiMD\AppInfo;

use OCP\AppFramework\App;

require_once __DIR__ . '/autoload.php';

$app = new App('codimd');
$container = $app->getContainer();


$domains = \OC::$server->getConfig()->getSystemValue("cbox.wopi.officeonline", ['http://cbox-codimd-01.cern.ch', ' http://cbox-codimd.cern.ch', 'http://wopiserver-test:8080']);
$policy = new \OCP\AppFramework\Http\EmptyContentSecurityPolicy();
foreach($domains as $domain) {
	$policy->addAllowedScriptDomain($domain);
	$policy->addAllowedFrameDomain($domain);
	$policy->addAllowedConnectDomain($domain);
}
\OC::$server->getContentSecurityPolicyManager()->addDefaultPolicy($policy);

\OCP\Util::addScript('codimd', 'script');
// \OCP\Util::addStyle('codimd', 'style');
