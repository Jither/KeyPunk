/**
 * Constants used in KeyPunk.
 */

(function(jk) {

	"use strict";
	
	jk.constants = 
	{
		HASH_FUNCTIONS:
		{
			// SHA-1
			"sha1" 			: { display: "SHA-1" },

			// SHA-2
			"sha2-224"		: { display: "SHA-224" },
			"sha2-256"		: { display: "SHA-256" },
			"sha2-384"		: { display: "SHA-384" },
			"sha2-512"		: { display: "SHA-512" },

			// RIPEMD-160
			"ripemd-160"	: { display: "RIPEMD-160" },

			// Keccak NIST SHA-3 3rd round submission: KECCAK[c] (M, d)
			// Currently (April 2014) labelled "SHA-3" in Crypto-JS
			"keccak-224"	: { display: "Keccak-224 [experimental]" },
			"keccak-256"	: { display: "Keccak-256 [experimental]" },
			"keccak-384"	: { display: "Keccak-384 [experimental]" },
			"keccak-512"	: { display: "Keccak-512 [experimental]" },

			// FIPS-212 April 2014 draft specification of SHA-3: KECCAK[c] (M || 01, d)
			// This will be kept in line with FIPS-212, and hence should be considered highly experimental
			"sha3-224"		: { display: "SHA-3 224 [experimental]" },
			"sha3-256"		: { display: "SHA-3 256 [experimental]" },
			"sha3-384"		: { display: "SHA-3 384 [experimental]" },
			"sha3-512"		: { display: "SHA-3 512 [experimental]" }
		},

		KEY_DERIVATION_FUNCTIONS:
		{
			"pbkdf2-sha-256"	: { display: "PBKDF2 SHA-256" }
		},

		ERRORS:
		{
			decrypt: "decrypt",
			syncNotSupported: "syncNotSupported",
			storage: "storage",
		},

		// A non-exhaustive list of multi-part top-level domains. If a domain ends
		// in one of these, the app will include one additional domain part, rather
		// than limiting it to two - e.g. amazon.com <=> amazon.co.uk
		TL_DOMAINS: 
		[
			// FI
			"aland.fi",
			// AU
			"wa.edu.au", "nsw.edu.au", "vic.edu.au", "csiro.au",
			"conf.au", "info.au", "oz.au", "telememo.au", "sa.edu.au",
			"nt.edu.au", "tas.edu.au", "act.edu.au", "wa.gov.au", "nsw.gov.au",
			"vic.gov.au", "qld.gov.au", "sa.gov.au", "tas.gov.au", "nt.gov.au",
			"act.gov.au", "archie.au", "edu.au", "gov.au", "id.au", "org.au",
			"asn.au", "net.au", "com.au", "qld.edu.au", 
			// BB
			"com.bb", "net.bb",  "org.bb", "gov.bb",
			// BR
			"agr.br", "am.br", "art.br", "edu.br", "com.br", "coop.br", "esp.br", 
			"far.br", "fm.br", "g12.br", "gov.br", "imb.br", "ind.br", "inf.br", 
			"mil.br", "net.br", "org.br", "psi.br", "rec.br", "srv.br", "tmp.br", 
			"tur.br", "tv.br", "etc.br", "adm.br", "adv.br", "arq.br", "ato.br",
			"bio.br", "bmd.br", "cim.br", "cng.br", "cnt.br", "ecn.br",
			"eng.br", "eti.br", "fnd.br", "fot.br", "fst.br", "ggf.br",
			"jor.br", "lel.br", "mat.br", "med.br", "mus.br", "not.br",
			"ntr.br", "odo.br", "ppg.br", "pro.br", "psc.br", "qsl.br",
			"slg.br", "trd.br", "vet.br", "zlg.br", "nom.br", 
			// CA
			"ab.ca", "bc.ca", "mb.ca", "nb.ca", "nf.ca", "nl.ca", "ns.ca", "nt.ca",
			"nu.ca", "on.ca", "pe.ca", "qc.ca", "sk.ca", "yk.ca",
			// CD
			"com.cd", "net.cd", "org.cd",
			// CN
			"ac.cn", "com.cn", "edu.cn", "gov.cn", "net.cn", "org.cn", "ah.cn", 
			"bj.cn", "cq.cn", "fj.cn", "gd.cn", "gs.cn", "gz.cn", "gx.cn", "ha.cn",
			"hb.cn", "he.cn", "hi.cn", "hl.cn", "hn.cn", "jl.cn", "js.cn", "jx.cn",
			"ln.cn", "nm.cn", "nx.cn", "qh.cn", "sc.cn", "sd.cn", "sh.cn", "sn.cn",
			"sx.cn", "tj.cn", "xj.cn", "xz.cn", "yn.cn", "zj.cn",
			// CK
			"co.ck", "org.ck", "edu.ck", "gov.ck", "net.ck",
			//CR
			"ac.cr", "co.cr", "ed.cr", "fi.cr", "go.cr", "or.cr", "sa.cr",
			// INT
			"eu.int",
			// IN
			"ac.in", "co.in", "edu.in", "firm.in", "gen.in", "gov.in", "ind.in",
			"mil.in", "net.in", "org.in", "res.in", 
			// ID
			"ac.id", "co.id", "or.id", "net.id", "web.id", "sch.id", "go.id",
			"mil.id", "war.net.id",
			// NZ
			"ac.nz", "co.nz", "cri.nz", "gen.nz", "geek.nz", "govt.nz", "iwi.nz",
			"maori.nz", "mil.nz", "net.nz", "org.nz", "school.nz",
			// PL
			"aid.pl", "agro.pl", "atm.pl", "auto.pl", "biz.pl", "com.pl", "edu.pl",
			"gmina.pl", "gsm.pl", "info.pl", "mail.pl", "miasta.pl", "media.pl",
			"nil.pl", "net.pl", "nieruchomosci.pl", "nom.pl", "pc.pl", "powiat.pl",
			"priv.pl", "realestate.pl", "rel.pl", "sex.pl", "shop.pl", "sklep.pl",
			"sos.pl", "szkola.pl", "targi.pl", "tm.pl", "tourism.pl", "travel.pl",
			"turystyka.pl",
			// PT
			"com.pt", "edu.pt", "gov.pt", "int.pt", "net.pt", "nome.pt",
			"org.pt", "publ.pt",
			// TW
			"com.tw", "club.tw", "ebiz.tw", "game.tw", "gov.tw", "idv.tw", "net.tw",
			"org.tw",
			// TR
			"av.tr", "bbs.tr", "bel.tr", "biz.tr", "com.tr", "dr.tr", "edu.tr",
			"gen.tr", "gov.tr", "info.tr", "k12.tr", "mil.tr", "name.tr", "net.tr",
			"org.tr", "pol.tr", "tel.tr", "web.tr",
			// ZA
			"ac.za", "city.za", "co.za", "edu.za", "gov.za", "law.za", "mil.za",
			"nom.za", "org.za", "school.za", "alt.za", "net.za", "ngo.za", "tm.za",
			"web.za", "bourse.za", "agric.za", "cybernet.za", "grondar.za",
			"iaccess.za", "inca.za", "nis.za", "olivetti.za", "pix.za",
			"db.za", "imt.za", "landesign.za",
			// KR
			"co.kr", "pe.kr", "or.kr", "go.kr", "ac.kr", "mil.kr", "ne.kr",
			// JP
			"chiyoda.tokyo.jp", "tcvb.or.jp", "ac.jp", "ad.jp", "co.jp", "ed.jp",
			"go.jp", "gr.jp", "lg.jp", "ne.jp", "or.jp",
			// MX
			"com.mx", "net.mx", "org.mx", "edu.mx", "gob.mx",
			// UK
			"ac.uk", "co.uk", "gov.uk", "ltd.uk", "me.uk", "mod.uk", "net.uk",
			"nic.uk", "nhs.uk", "org.uk", "plc.uk", "police.uk", "sch.uk",
			// US
			"ak.us", "al.us", "ar.us", "az.us", "ca.us", "co.us", "ct.us",
			"dc.us", "de.us", "dni.us", "fed.us", "fl.us", "ga.us", "hi.us",
			"ia.us", "id.us", "il.us", "in.us", "isa.us", "kids.us", "ks.us",
			"ky.us", "la.us", "ma.us", "md.us", "me.us", "mi.us", "mn.us",
			"mo.us", "ms.us", "mt.us", "nc.us", "nd.us", "ne.us", "nh.us",
			"nj.us", "nm.us", "nsn.us", "nv.us", "ny.us", "oh.us", "ok.us",
			"or.us", "pa.us", "ri.us", "sc.us", "sd.us", "tn.us", "tx.us",
			"ut.us", "vt.us", "va.us", "wa.us", "wi.us", "wv.us", "wy.us",
			// UA
			"com.ua", "edu.ua", "gov.ua", "net.ua", "org.ua", "cherkassy.ua",
			"chernigov.ua", "chernovtsy.ua", "ck.ua", "cn.ua", "crimea.ua",
			"cv.ua", "dn.ua", "dnepropetrovsk.ua", "donetsk.ua", "dp.ua",
			"if.ua", "ivano-frankivsk.ua", "kh.ua", "kharkov.ua", "kherson.ua",
			"kiev.ua", "kirovograd.ua", "km.ua", "kr.ua", "ks.ua", "lg.ua",
			"lugansk.ua", "lutsk.ua", "lviv.ua", "mk.ua", "nikolaev.ua",
			"od.ua", "odessa.ua", "pl.ua", "poltava.ua", "rovno.ua", "rv.ua",
			"sebastopol.ua", "sumy.ua", "te.ua", "ternopil.ua", "vinnica.ua",
			"vn.ua", "zaporizhzhe.ua", "zp.ua", "uz.ua", "uzhgorod.ua",
			"zhitomir.ua", "zt.ua",
			// IL
			"ac.il", "co.il", "org.il", "net.il", "k12.il", "gov.il", "muni.il",
			"idf.il", "co.im", "org.im"
		]
	};
}(window.keypunk = window.keypunk || {}));