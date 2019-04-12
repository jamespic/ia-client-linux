#!/usr/bin/env make -f

.PHONY: build
build: extension/dist.crx

extension/dist.crx: extension/dist
	cd extension && yarn crx

extension/dist:
	cd extension && yarn install && yarn build

.PHONY: clean
clean:
	git clean -Xdf

.PHONY: install
install: build
	mkdir -p "$(DESTDIR)/etc/chromium/native-messaging-hosts"
	mkdir -p "$(DESTDIR)/etc/opt/chrome/native-messaging-hosts"
	cp dist-files/io.github.jamespic.ia_extension.json "$(DESTDIR)/etc/chromium/native-messaging-hosts"
	cp dist-files/io.github.jamespic.ia_extension.json "$(DESTDIR)/etc/opt/chrome/native-messaging-hosts"

	mkdir -p "$(DESTDIR)/usr/lib/ia-plugin"
	cp native/* "$(DESTDIR)/usr/lib/ia-plugin"

	cp extension/dist.crx "$(DESTDIR)/usr/lib/ia-plugin/extension.crx"

	mkdir -p "$(DESTDIR)/usr/share/google-chrome/extensions"
	cp dist-files/himmiahjncgidoehmgoifejbbmpbaime.json  "$(DESTDIR)/usr/share/google-chrome/extensions"

	mkdir -p "$(DESTDIR)/usr/share/chromium-browser/extensions"
	cp dist-files/himmiahjncgidoehmgoifejbbmpbaime.json  "$(DESTDIR)/usr/share/chromium-browser/extensions"

.PHONY: uninstall
uninstall:
	rm "$(DESTDIR)/etc/chromium/native-messaging-hosts/io.github.jamespic.ia_extension.json"
	rm "$(DESTDIR)/etc/opt/chrome/native-messaging-hosts/io.github.jamespic.ia_extension.json"

	rm -dr "$(DESTDIR)/usr/lib/ia-plugin"

	rm  "$(DESTDIR)/usr/share/google-chrome/extensions/himmiahjncgidoehmgoifejbbmpbaime.json"
	rm  "$(DESTDIR)/usr/share/chromium-browser/extensions/himmiahjncgidoehmgoifejbbmpbaime.json"
