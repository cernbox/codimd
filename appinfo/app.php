<?php

namespace OCA\CodiMD\AppInfo;

$app = new Application();

$domains = \OC::$server->getConfig()->getSystemValue("cbox.wopi.officeonline", ['https://qa.cernbox.cern.ch', 'https://cernbox.cern.ch', 'http://cbox-codimd-01.cern.ch', ' http://cbox-codimd.cern.ch', 'http://wopiserver-test:8080', 'https://cbox-wopidev-01:8000/']);
$policy = new \OCP\AppFramework\Http\EmptyContentSecurityPolicy();
foreach($domains as $domain) {
	$policy->addAllowedScriptDomain($domain);
	$policy->addAllowedFrameDomain($domain);
	$policy->addAllowedConnectDomain($domain);
}
\OC::$server->getContentSecurityPolicyManager()->addDefaultPolicy($policy);

\OCP\Util::addScript('codimd', 'script');
// \OCP\Util::addStyle('codimd', 'style');
