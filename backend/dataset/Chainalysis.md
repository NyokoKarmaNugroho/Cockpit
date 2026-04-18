Get started

# Introduction

Chainalysis Sanctions Screening encompasses two key tools for identifying cryptocurrency
wallet addresses linked to sanctions designations:

```
Chainalysis SanctionsAPI:A free-to-use RESTful API that returns whether a cryptocurrency
wallet address has been included in a sanctions designation. The API is available for all to
use and is regularly updated to reflect the latest sanctions designations.
Chainalysis oracle: Designed for blockchain smart contract ecosystems, the Chainalysis
oracle is a smart contract that provides on-chain sanctions screening. This solution enables
decentralized applications (dApps) to directly interact with and verify wallet compliance with
sanctions lists within the blockchain environment.
```
```
Note: If you are an existing Chainalysis customer, you already have access to all information
provided by the Chainalysis Sanctions API and more. Learn morehere.
```

## Related resources (broader crypto crime and investigations)

Third-party research that complements **sanctions screening** (this file’s Chainalysis API and oracle). Not Chainalysis documentation.

| Resource | What it covers |
|----------|----------------|
| [A Guide to Crypto Crime](https://info.arkm.com/research/a-guide-to-crypto-crime) (Arkham) | Crypto crime categories (fraud, theft, laundering, ransomware, sanctions evasion), on-chain vs off-chain patterns, reporting and intelligence workflows. |
| [Online Sleuth: How to Be a Blockchain and Crypto Investigator](https://info.arkm.com/research/online-sleuth-how-to-be-a-blockchain-and-crypto-investigator) (Arkham) | Independent investigators, OSINT, address clustering, block explorers, labelled entities, tracing flows alongside public records. |

For **automated checks against sanctions-listed crypto addresses**, use the Chainalysis Sanctions API and oracle documented below.

#### -

#### -


Get started

# Definition of sanctioned entities

Sanctioned entities refer to entities listed on economic/trade embargo lists, such as by the US,
EU, or UN, with which anyone subject to those jurisdictions is prohibited from dealing. Currently,
this includes the Specially Designated Nationals (SDN) list†of the US Department of the
Treasury’sOffice of Foreign Assets Control (OFAC).

You can search the full list of OFAC Specially Designated Nationals in OFAC’s
sanctions database.

_†_ While we will be taking reasonable measures to keep the Chainalysis Sanctions API up-to-
date, Chainalysis cannot guarantee the accuracy, timeliness, suitability, or validity of the data.


Get started

# Get more help

## Looking for more risk intelligence?

The Chainalysis Sanctions Screening API provides any cryptocurrency business, protocol, or
organization a simple way to quickly check if an address is on a sanctions list before allowing it
to connect with their service. To get sanctions data on-chain, consider using our public
Chainalysis oracle.

If you want to look more holistically at the risk profile of entities you interact with, Chainalysis
provides a range of solutions to help mitigate exposure to risky activity like terror financing,
ransomware, and more. Contact us to learn more.

## Already a Chainalysis customer?

If you are a Chainalysis customer, you already have access to all information provided by the
Chainalysis Sanctions API and more, such as additional risk categories and the clustering and
identification of addresses affiliated with sanctioned entities that are not included in the SDN
list. We provide our sanctions identifications in the form of Chainalysis Identifications.
Chainalysis customers can learn more about these topics in the following Knowledge Base
articles:

```
Chainalysis Identifications
Clustering and identification
```
## Is the API different from the oracle?

#### -

#### -


The Chainalysis Sanctions API is a RESTful API that returns information for all crypto addresses
on the SDN list, whereas the Chainalysis oracle is an on-chain smart contract that checks only
against sanctioned Ethereum/EVM addresses.

Additionally, the API returns other information provided by OFAC about sanctioned addresses,
included in the response properties name, description, and url.

## Contact support

If you need further assistance, contact sanctions-api-support@chainalysis.com to ask us any
questions or provide feedback.


# API Overview

## Authentication

To authenticate your requests, please supply an API key in the HTTP header x-api-key:

```
--header 'X-API-KEY: {YOUR_API_KEY}'
```
This API doesn’t support cross-origin requests (CORS). To access it, make requests from a
backend server.

## Create an API key

To get an API key, please sign up here. Chainalysis will email an API key to the supplied email.

## Rate limiting

Your API key allows you to make 5000 requests per 5 minutes. If your API Key is rate limited, you
will receive 403 errors until your limit resets (every 5 minutes). If you need a higher limit, please
contact Chainalysis.


Reference

# Check if an address is sanctioned

This endpoint checks if an address is sanctioned. The response includes an array of sanctions
data, if any. Provide the address to check as the addressToCheck path parameter.

```
cURL
```
```
Try it
```
```
GETGET //apiapi//v1v1//addressaddress//::addressToCheckaddressToCheck
$ curl https://public.chainalysis.com/api/v1/address/0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a
> -H "X-API-Key: <apiKey>"
```
```
200 0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a Example
1 {
2 "identifications": [
3 {
4 "category": "sanctions",
5 "name": "SANCTIONS: OFAC SDN Secondeye Solution 2021-04-15 1da5821544e25c636c1417ba96ad
6 "description": "Pakistan-based Secondeye Solution (SES), also known as Forwarderz, is a
7 "url": "https://home.treasury.gov/news/press-releases/jy0126"
8 }
9 ]
10 }
```
### Path parameters

**addressToCheck** string Required

The address to check for sanctions. Note: The string is case-sensitive.


### Headers

**X-API-Key** string Required

### Response

A list of sanctions designations for the address, if any.

**identifications** list of objects

An array of identification details for the provided address.Note: If the array is empty, no sanctions are
associated with the address.

```
Hide 4 properties
```
```
category string or null
The Chainalysis entity category. For sanctioned addresses, the value will be sanctions.
```
```
name string or null
The OFAC name associated with the sanctioned address. This may include additional context, such as the
source or designation.
```
```
description string or null
A description from OFAC for the sanctioned address. It may include context or historical background.
```
```
url string or null
A URL to the original source or official sanctions information.
```
### Errors

```
400 Bad Request Error
```

Get started

# Terms of Use

## CHAINALYSIS SANCTIONS API TERMS OF USE

Last updated: 04 April 2022

1. Acceptance.

These Terms of Use (the “Terms”) govern your (the individual reviewing these Terms, “you”)
access to and use of this application programming interface, including any data derived
therefrom (the “Sanctions API”).

The Sanctions API is provided by Chainalysis, Inc. (“Chainalysis”, “Company”, “we”, “us”, or “our”).
You acknowledge and agree that you are at least the legal age of majority in the jurisdiction
where you reside and are able to form a legally binding contract. In the event you are using the
Sanctions API and are entering into this agreement on behalf of a corporation, partnership, or
other legal entity, you hereby warrant that you are duly authorized to represent and bind such
entity to these Terms. All references to “you” or “your” in these Terms shall either refer to such
entity or the person using this Sanctions API, as applicable.

Please read these Terms carefully. You must read and accept them fully before you commence
using our Sanctions API and, once you start accessing or using the Chainalysis Sanctions API,
you are agreeing to be fully legally bound by all provisions contained herein. You, as a user of the
Chainalysis Sanctions API, acknowledge and agree that the Terms constitute a legally binding
contract between you and Chainalysis governing your use of the Sanctions API. Should you lack
the aforesaid authority or if you (or the entity that you represent) do not agree with these Terms,
you are not permitted to use the Chainalysis Sanctions API. You acknowledge that you have
read and understand our Privacy Policy , which also applies to your use of the Sanctions API.


Our Privacy Policy may be amended from time to time and is incorporated by reference, and, to
the extent permitted by applicable law, you agree to be bound by such policy.

2. License.

2.1 License Grant. Subject to these Terms, Chainalysis hereby grants you a non-exclusive, non-
transferable, non-assignable license during the Term (as defined in Section 5.1) to access and
use the Chainalysis Sanctions API to develop, test, support, and integrate with your software
application, mobile application, website, platform, service or product. This license is subject to
the limitations set forth in Sections 3 and 5 below, and you agree that violation of Section 3 will
automatically terminate the license granted herein to you to use the Chainalysis API (such
termination of license being without any liability whatsoever to Chainalysis). Chainalyisis will
therefore be entitled to at any time thereafter to immediately suspend, obstruct, restrict or
terminate your access to the Sanctions API without any notice or liability to you, and without
prejudice to any other remedies available to Chainalysis at law, in contract, tort or equity.

2.2 Changes to the Terms and API.Your use of the Chainalysis Sanctions API is subject to your
continued compliance with the provisions of these Terms, and in order to further develop our
Chainalysis Sanctions API, we may at any time make changes to the Sanctions API and/or these
Terms without any notice to you. You agree that it is your responsibility to regularly check
our websitefor updates to our Sanctions API and/or these Terms. If you do not agree to a
change, you must stop using the Sanctions API and terminate these Terms. In addition, parts of
our Sanctions API may be undocumented, including certain aspects, events, methods and
properties.

2.3 Limits. Chainalysis may limit the number of requests you may make to the Sanctions API
gateway to protect the Chainalysis system or enforce reasonable limits on your use of the
Sanctions API and accordingly, specific throttling limits may be imposed and modified from time
to time by Chainalysis. Chainalysis will provide support and maintenance of the Sanctions API
at our sole discretion and we may stop providing such support or maintenance at any time
without notice and without any obligation or liability to you.

3. Prohibited Activities.

You agree that you will not:


```
Use the Sanctions API in connection with any illegal, infringing, or unauthorized purpose, or
in any manner that damages or interferes with the Sanctions API’s operation or requires
Chainalysis to obtain any license, authorization, or other permission from a governmental
agency or other third party;
Remove any copyright, trademark or other proprietary rights notices contained in or
connected to the Sanctions API or any reports or outputs thereof;
Circumvent any security measures or use restrictions in the Sanctions API, including selling,
sublicensing, or otherwise transferring your access to the Sanctions API;
Use the Sanctions API to create a product or service with features that are substantially
similar to or that re-create the features of any Chainalysis product or service;
Use any robot, spider, or automated process to scrape, crawl or index any aspect of the
Sanctions API;
Take any action that may impose an unreasonable or disproportionately large load on
Chainalysis infrastructure, as determined by Chainalysis;
Use data that Chainalysis intended to provide in the form of anonymous data to personally
identify end users unless expressly permitted by Chainalsysis in writing; or
Attempt to do any of the foregoing.
```
4. Your Responsibilities

4.1 Users. Subject to the terms and conditions of these Terms, you may provide your employees,
affiliates, or contractors, the ability to access and use the Sanctions API (each, an “Authorized
User”). At all times, you shall be responsible and liable for all acts or omissions of your
Authorized Users, your affiliates, and your affiliates’ employees, contractors, and agents, in
connection with these Terms, as if you had been the performing party. You warrant that the
information you provided to Chainalysis in order to obtain access to the Sanctions API is true,
complete, and accurate.

4.2 Appropriate Safeguards.You shall use and maintain appropriate legal, organizational,
physical, administrative, and technical measures, and security procedures to safeguard and
ensure the security of the Sanctions API and to protect the Sanctions API from unauthorized
access, unauthorized duplication, use, modification, or loss, including your assigned Sanctions
API keys or other access or security credentials.

#### - - - - - - - -


4.3 Compliance with Applicable Laws.Notwithstanding anything in these Terms, you will ensure
that your use of the Sanctions API complies with applicable laws. You will not use the Sanctions
API in connection with, or for the benefit of, provide Authorized User credentials to, or otherwise
permit access to the Sanctions API by, any country, organization, entity, or person embargoed,
blocked, sanctioned, or otherwise restricted by any government, including those on sanctions list
identified by the United States Office of Foreign Asset Control.

4.4 Data Privacy.You will ensure that your collection, use, disclosure, or storage of any data in
your use of the Sanctions API will comply with applicable data privacy laws. You will provide
Chainalysis with commercially reasonable assistance upon request to facilitate our compliance
with the same. Also, you will use commercially reasonable efforts to update cached data or
delete data obtained via use of the Sanctions API upon reasonable request by Chainalysis.

5. Term and Termination.

5.1 TermThese Terms will be in effect on the date you agree to them or begin,access or use the
Chainalysis Sanctions API, whichever is earliest, and remain in effect until terminated. These
Terms and/or access to the Sanctions API (or parts thereof) may be terminated, discontinued, or
suspended by Chainalysis at any time, for any reason or no reason at all, with or without
advance notice. Additionally, this Agreement will automatically terminate upon the effective
date of an effective master subscription agreement. You may terminate these Terms at any time
by ceasing use of the Sanctions API.

5.2 Effect of Termination.Upon termination of these Terms, you shall immediately cease using
and delete, destroy or return (or cause any affiliates or third parties with whom you’ve shared
copies) all copies of the API Documentation, data, or other information procured from
Chainalysis in accessing the Sanctions API. Notwithstanding anything to the contrary in these
Terms, any rights, obligation, or required performance of the parties in these Terms which, by
their express terms or nature and context are intended to survive termination or expiration of
these Terms, will survive any termination or expiration of these Terms.

6. Ownership and Intellectual Property.

6.1 API.Chainalysis owns and retains all right, title and interest (and all related intellectual
property) in and to the Sanctions API, including all related intellectual property rights obtained
at any time.


6.2 Your Data. Notwithstanding anything to the contrary in these Terms, you grant Chainalysis a
non-exclusive, irrevocable, perpetual, worldwide, royalty-free license to use any information
made available through the Sanctions API or otherwise provided to Chainalysis in connection
with these Terms to provide, improve, enhance, develop and offer services or products.

6.3 Performance Data. Chainalysis owns all metadata in connection with installation,
registration, use, and performance of the Sanctions API, including response times, load
averages, usage statistics, and activity logs.

6.4 Feedback. Notwithstanding anything to the contrary in these Terms, you hereby grant
Chainalysis a non-exclusive, irrevocable, perpetual, worldwide, royalty-free license to use any
ideas, suggestions, messages, comments, input, recommendations, or enhancement requests
provided you may provide (“Feedback”) in connection with the Sanctions API to Chainalysis for
any lawful purpose. You acknowledge that you provide Feedback voluntarily, and we have no
obligation to use any Feedback.

7. Disclaimers and Limitation of Liability.

7.1 Disclaimer. NEITHER PARTY MAKES, AND EACH PARTY EXPRESSLY DISCLAIMS, ANY
REPRESENTATIONS OR WARRANTIES IN CONNECTION WITH THESE TERMS, WHETHER
EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION,
WARRANTIES OF MERCHANTABILITY, ACCURACY, COMPLETENESS, FITNESS FOR A
PARTICULAR PURPOSE, AND NON-INFRINGEMENT. THERE IS NO WARRANTY THAT THE
SANCTIONS API (AND INFORMATION PROVIDED THEREFROM) WILL BE ERROR-FREE, OR
MEET YOUR REQUIREMENTS. WITHOUT LIMITING THIS SECTION, CHAINALYSIS MAKES THE
SANCTIONS API AVAILABLE ON AN “AS IS” BASIS.

7.2 Limitation of Liability.TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO
EVENT WILL CHAINALYSIS BE LIABLE FOR CONSEQUENTIAL, SPECIAL, INCIDENTAL, OR
INDIRECT DAMAGES, OR LOST PROFITS, OR LOSS OF DATA ARISING OUT OF, OR IN
CONNECTION WITH, THE SANCTIONS API, HOWEVER CAUSED AND REGARDLESS OF THE
THEORY OF LIABILITY ASSERTED (INCLUDING NEGLIGENCE, GROSS NEGLIGENCE OR
WILLFUL MISCONDUCT), WHETHER IN AN ACTION IN CONTRACT, STRICT LIABILITY, TORT,
OR OTHERWISE, EVEN IF THE PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH
DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THESE TERMS,
CHAINALYSIS’ MAXIMUM AGGREGATE LIABILITY IN CONNECTION WITH THE SANCTIONS API


#### SHALL NOT EXCEED ONE HUNDRED U.S. DOLLARS ($100 USD). THIS LIMITATION IS

#### CUMULATIVE AND THE EXISTENCE OF MORE THAN ONE CLAIM WILL NOT ENLARGE THIS

#### LIABILITY LIMITATION.

#### NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THESE TERMS, YOU ACKNOWLEDGE

#### AND AGREE THAT CHAINALYSIS PROVIDES A REPORTING AND INFORMATION SANCTIONS

#### API ONLY, AND HAS NO RESPONSIBILITY OR LIABILITY FOR THE TRANSACTIONS ANALYZED

#### BY THE SANCTIONS API OR FOR ANY DECISION MADE OR ANY ACTS OR OMISSIONS IN

#### CONNECTION WITH THE SANCTIONS API, AND THAT IN NO EVENT WILL CHAINALYSIS BE

#### RESPONSIBLE IN CONNECTION WITH ANY ACTUAL OR POTENTIAL LEGAL OR REGULATORY

#### VIOLATIONS UNCOVERED IN CONNECTION WITH YOUR USE OF THE SANCTIONS API.

8. Indemnification.

You shall indemnify and hold harmless Chainalysis and its officers, directors and employees
against any third-party claims for loss, cost, damage, expense or liability (including payment of
reasonable attorneys’ fees and court costs) to the extent arising from, or in connection with, your
use of this Sanctions API or breach of these Terms or the Chainalysis Privacy Policy.

9. Governing Law and Jurisdiction.

These Terms, including their formation, are governed by the laws of the State of New York,
without giving effect to conflicts of laws principles that would require a different result. Any
claim, action or judicial proceeding arising out of or related to these Terms will be brought in the
federal or state courts located in New York County, New York.

10. General Terms.

11.1 Assignment. These Terms, and any rights and licenses granted hereunder, may not be
transferred or assigned by you, but may be assigned by Chainalysis without restriction and
without reference or notice to you.

11.2 Waiver.A party’s failure to enforce any provision of these Terms will not be deemed a
waiver of future enforcement of that or any other provision.

11.3 Relationship of the Parties.This Agreement does not create or imply any partnership,
agency, or joint venture.


11.4 Interpretation; Severability.If any of the provisions of these Terms are held by a court or
other tribunal of competent jurisdiction to be void or unenforceable, such provisions shall be
limited or eliminated to the minimum extent necessary and replaced with a valid provision that
best embodies the intent of these Terms, so that these Terms shall remain in full force and effect.

11.5 Entire Agreement. These Terms and the Chainalysis Privacy Policy constitute the entire
agreement between the parties with respect to the Sanctions API and supersedes any prior
agreements, proposals and understandings about the same subject.


