KeyPunk
=======

__Important__: See warning below. Don't use this for anything critical!

I've been a long time user of the excellent [PasswordMaker](http://www.passwordmaker.org).
The idea (although not the implementation) is brilliantly simple: Passwords need to be
strong - and unique for every website. Rather than storing all of them in a password manager,
why not generate them "out of thin air" whenever they're needed?

PasswordMaker - and KeyPunk - does this by way of a master password combined with
cryptographic hashes.

PasswordMaker served me well - and still does - first on Firefox, then on
Chrome. While there may well be features of PWM that I missed over the years, the
following are features that I missed in the best of the Chrome extensions, causing
me to make my own:

- __"Use characters from all sets"__. This setting forces at least one character from
  each of the specified character sets to be used (e.g. uppercase, lowercase, digits, 
  symbols...). Useful because sometimes a password will "randomly" end up with, for
  example, no digits - causing a website's password policy to reject the password. In
  PWM for Chrome that means you have to set up a different profile for that specific
  site.

- __New hash functions__. KeyPunk, at the moment, includes support for:
  - SHA-1
  - SHA-2 - 224, 256, 384, 512
  - RIPEMD-160
  - Keccak (the eventual SHA-3 as it worked after round 3 of the NIST competition) -
    224, 256, 384, 512
  - SHA-3 (the current implementation, pending the finalization of FIPS-202) - 224, 
    256, 384, 512
  - HMAC versions of all the above

- __Input rewiring__. Rather than tying the password for e.g. amazon.co.uk to
  the one generated for amazon.com by making a specific profile for it, inputs
  can be specifically set up to "rewire" to a different input - meaning entering
  amazon.co.uk will automatically set up profile and input as if the website were
  amazon.com.

- __Additional protection of master password__ through key derivation (PBKDF2).

- __A nice, fluent interface in Chrome__. Or so I think.

It's also my first large Chrome extension project. As such, it has no real
architecture. ;-)

WARNING!!!
==========

KeyPunk is not yet ready for primetime! It:

- has quite a few known issues.
- hasn't been tested thoroughly in any aspect yet.
- has some essential missing features (such as backup/export).
- only exists on one platform at the moment.

Right now, it's very much a work in progress, and if you use it, you do so at
your own risk. __You very likely *will* lose all your data__.

In addition to being totally unsupported, the password generation scheme is also
__entirely incompatible with any other password generator outthere__. Which means if
it breaks, there's nothing you, or I, can do to restore your access to your passwords.

There's also no build procedure, no real documentation, and it's not released on the
Chrome web store.

In short, for now it's only on GitHub for "educational purposes". Caveat emptor.

Should you decide to take a walk on the wild side, also be aware that the __SHA-3
implementations are even more experimental than the rest of the app__. It's my 
intention to eventually make a version of KeyPunk for Android and iOS. But the
"pure" Keccak hash may end up never getting an implementation on those platforms.
Also, the SHA-3 specification (FIPS-202) is still in draft and may change. If/when
that happens, the SHA-3 implementation of KeyPunk will also change, rendering any
passwords generated before the change unrecoverable.

About the password generation
=============================

Parameters
----------
Although KeyPunk is somewhat simplified compared to PasswordMaker, it still has
quite a few parameters.

The main point is obviously to generate strong and unique passwords for e.g. 
websites. However, it's also worth considering the non-reversability of the generated
passwords - in other words, if an attacker gets hold of a password for one or more
websites, can he determine the *master* password?

KeyPunk's generated passwords are based on cryptographic hashes which are, by nature,
not reversible. However, the input (i.e. the master password) *can* be deduced by brute
force - i.e. trying to generate passwords using possible master passwords and see if
the output matches the hash. This process can be sped up by use of rainbow tables.

Given a generated password such as __8bn$d]VqP<H+"Vy|__, in order for an attacker to
have success with this approach, he needs to know as many as possible of the following
parameters. Namely all the ones that determine what output KeyPunk generates:

1. That the password *was* generated using __KeyPunk's scheme__ (as opposed to, say, 
   PasswordMaker's or LastPass' generators).
2. The __domain name__. Considering how the attacker likely got the password in the
   first place, this one he likely knows - although input rewiring means the input
   might actually be a different value than the domain name he got the password from.
3. The __hash function__ used. SHA-1, SHA-512, RIPEMD-160...
4. Whether __HMAC__ was enabled.
5. The *exact* __alphabet__ used. While he can tell that the alphabet includes upper
   and lower case letters, digits and symbols, from a single - or even a few - password(s),
   he cannot tell *which* symbols, the order of symbols, if some letters were left out,
   whether upper case letters were specified before or after lower case, etc. Changing any
   one of these "sub-parameters" would affect the generated password.
6. Whether __Must use all character sets__ was enabled. This won't make a difference in
   many cases, but obviously, if it *was* in effect, the "8" in the above might be a
   substitution replacing a different character. If it *wasn't* in effect, that "8" came
   straight from the hash function output.
7. Any __modifier__ that might be in effect.
8. If __Key Derivation__ was enabled, and if so, the KDF used (although at the moment
   there's only one); the salt (if changed from the default); and the number of iterations
   (if changed from the default).

Key Derivation
--------------
Key Derivation not only serves as an additional parameter. It also slows down any attack
considerably. Although the limitations of javascript means that the number of iterations
cannot be as high as is usually recommended, calculating, say, 1000 iterations of SHA-256
still takes more time than no iterations. And it will need to be done for every attempted
master password.

For key derivation, KeyPunk uses PBKDF2 with SHA-512 as the underlying hash function.

PBKDF2 is mostly known for its use in hashing passwords on the authenticating side - e.g.
for database storage. In that use case, the best practice is to make a cryptographically
random salt for every password and store it along with the hashed password. It's also possible
to make the number of iterations variable and e.g. increase it on a regular basis - by, again,
storing those parameters along with the hash.

Since KeyPunk needs to generate *the same password every time* - with only a master password
and a domain name as input - it cannot vary the salt or number of iterations per password (well,
it could, but the convenience would be lost).

However, the point regarding the fixed salt becomes moot when considering that the attack
scenario is very different from a website being attacked. The reason for varying salt when
storing passwords in a database is to counteract attacking multiple hashed passwords in parallel
with the same rainbow table. The attacker attacking a KeyPunk-generated password, however, is
not likely to have thousands or even hundreds (or tens) of passwords generated by the same user
(or even multiple users all using the default settings).

TL;DR
-----
Because users are always most likely to stick with default settings, it's certainly possible
that someone could compromise, say, badpasswordstorage.com's database, generate a rainbow table
with passwords based on KeyPunk's default settings, and thereby find master passwords for some
poor users.

The way to make that scenario much less likely:

- Change your settings from the defaults
- Choose a strong master password

Storage security considerations
===============================

By default, KeyPunk is set up for a compromise between security and convenience, but
is *is* opinionated about certain security considerations:

- The master password cannot be stored anywhere except in memory. This means it lives
  for the duration of the browser session. Even this can (in time) be disabled, requiring
  the user to enter the master password every time the extension popup is opened.
  The option indicating whether to store master password in memory is stored locally to
  disk, not synced, allowing different policies for different clients, even if syncing
  settings and profiles.

- A checksum (2 bytes of a SHA-512 hash) of the master password may be stored to aid
  in verifying the entry - as an alternative to the "Confirm password" box. This checksum
  can only be stored locally to disk.

- Profiles and settings may be stored in Chrome's synced storage in order to sync
  between different clients. Because Chrome storage isn't encrypted, KeyPunk does
  client side encryption using the Stanford Javascript Cryptography Library with a
  key provided by the user. Although Javascript encryption isn't exactly bullet
  proof, SJCL is the most trustworthy implementation, and any hint of the master
  password itself is obviously kept out of synced data. Still, the synced data *does*
  include potential "salts", since the choice of hash algorithm, alphabet, length, 
  modifier, associated inputs (domain names), key derivation setup etc. are all stored 
  as part of these data.

Why "KeyPunk"?
==============

I generally dislike the use of "punk" as a marketing label. But I'm not doing marketing.

KeyPunk is really a play on "keypunch" - which has little to do with what KeyPunk does, but
was the one somewhat interesting name I could come up with. The product was more important
than the name. :-)
