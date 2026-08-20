// USDA FSIS establishments -- GENERATED, do not hand-edit.
//
// Rebuild:  bash scripts/supplychain/fetch_reference_data.sh
//           python3 scripts/supplychain/build_reference_modules.py
//
// Source: USDA FSIS Meat, Poultry and Egg Product Inspection Directory.
// A work of the US Government -- public domain (CC0), no licence friction.
// Built 2026-08-20 from 7237 directory rows.
//
// WHY THIS IS THE US PRIZE: it is keyed on the establishment number
// printed INSIDE THE USDA INSPECTION MARK on the pack. That is a real,
// non-fuzzy, package-readable join -- not a fuzzy brand match -- and every
// row carries the facility's actual coordinates.
//
// WHAT IT PROVES, AND WHAT IT DOES NOT: this is where the product was
// PROCESSED, slaughtered or packed. It is NOT where the animal was raised
// or the ingredients grown. Canned tuna with a French health mark was
// canned in France; the tuna came from an ocean. Copy built on this table
// must say 'processed here', never 'from here'.
//
// Coordinates are rounded to 3 decimals (~110 m) -- far finer than a map
// pin needs, and a fraction of the bundle size of full precision.
//
// One facility can hold several grant numbers (meat, poultry, egg) and the
// pack prints only ONE of them, so compound entries like 'G1126A+V1126A'
// are indexed under each number separately: 13290 numbers from 7237 rows.

export interface FsisEstablishment {
  establishmentNumber: string;
  name: string;
  city: string;
  state: string;
  lon: number;
  lat: number;
}

export const FSIS_SOURCE = {
  label: 'USDA FSIS — Meat, Poultry and Egg Product Inspection Directory (public domain)',
  url: 'https://www.fsis.usda.gov/inspection/establishments/meat-poultry-and-egg-product-inspection-directory',
} as const;

/** How many establishment numbers are bundled. Used by the data tests. */
export const FSIS_COUNT = 13290;

/** est<TAB>name<TAB>city<TAB>state<TAB>lon<TAB>lat, one per line. */
const BLOB = `\
G1016	M.G. Waldbaum Company	Gaylord	MN	-94.207	44.554
G1028	Papetti's Hygrade Egg Products Inc.	Elizabeth	NJ	-74.189	40.658
G1105	American Egg Products, LLC	Blackshear	GA	-82.233	31.304
G1126A	Shepherds Processed Eggs	Spanish Fork	UT	-111.737	40.115
G1126B	Shepherds Processed Eggs / Muscle Eggs	Spanish Fork	UT	-111.737	40.114
G1127	M.G. Waldbaum Company	Lenox	IA	-94.565	40.869
G1141	Wabash Valley Produce, Inc.	Farina	IL	-88.778	38.829
G1183	Deb El Food Products, LLC	Elizabeth	NJ	-74.19	40.659
G1215	Cargill Kitchen Solutions	Monticello	MN	-93.798	45.304
G1219	Rose Acre Farms	Guthrie Center	IA	-94.52	41.695
G1223	Siouxpreme Egg Products	Sioux Center	IA	-96.179	43.075
G1253	Cort Acres Breaker Plant	Seymour	IN	-85.948	38.992
G1256	Newburgh Egg Corp	Woodridge	NY	-74.57	41.71
G1264	National Food NW LLC	Arlington	WA	-122.163	48.149
G1349	Papetti's Hygrade Egg Products Inc.	Elizabeth	NJ	-74.194	40.676
G1394	OFD Foods LLC	Albany	OR	-123.111	44.614
G1415	Nulaid Foods Inc.	Ripon	CA	-121.125	37.732
G1450A	Wilcox Farms Inc.	Roy	WA	-122.476	46.887
G1455	M.G. Waldbaum Company	Gaylord	MN	-94.197	44.557
G1486	Pulaski County Breaker Plant	Francesville	IN	-86.766	40.963
G1505	The Meat Block LLC	Greenville	WI	-88.548	44.305
G1547	ISE Newberry, Inc.	Newberry	SC	-81.634	34.282
G1566	Henningsen Foods, Inc.	Ravenna	NE	-98.911	41.024
G1579	Wabash Valley Produce, Inc	Dubois	IN	-86.793	38.45
G1579A	Wabash Valley Foods, LLC.	Dubois	IN	-86.739	38.442
G15816	Heggies Pizza, LLC	Milaca	MN	-93.645	45.767
G1593	Echo Lake Foods	Huntington	IN	-85.497	40.88
G1602	Cal-Maine Foods, Inc.-Indiana Egg Products	Warsaw	IN	-85.967	41.233
G1606	Willamette Egg Farms	Canby	OR	-122.681	45.153
G1610	Papetti's Hygrade Egg Products, Inc.	Elizabeth	NJ	-74.193	40.676
G1612	Marshall Egg Products Company	Marshall	MO	-93.21	39.122
G1616	Papetti's Hygrade Egg Products, Inc.	Klingerstown	PA	-76.697	40.66
G1620	Deb El Food Products, LLC	Thompsonville	NY	-74.61	41.671
G1634	Taylor Egg Products, Inc.	Dover	NH	-70.935	43.193
G1673	Perham Egg, LLC	Perham	MN	-95.564	46.594
G1704B	Herbruck's Poultry Ranch	Lake Odessa	MI	-85.084	42.872
G1798	Daybreak Foods, Inc.	Long Prairie	MN	-94.857	45.981
G1804	Cargill Kitchen Solutions, Inc.	Lake Odessa	MI	-85.136	42.793
G1841E	Sugar Creek	Cambridge City	IN	-85.152	39.842
G2028	Culver Duck Farms, Inc.	Middlebury	IN	-85.699	41.705
G20729	Daybreak Foods, Inc.	Graettinger	IA	-94.647	43.24
G20813	Sunrise Farms Inc.	Harris	IA	-95.443	43.352
G20865	M.G. Waldbaum Company	Gaylord	MN	-94.197	44.557
G21040	Iowa Cage Free, LLLP	Thompson	IA	-93.72	43.42
G2131	Dakota Tom Sandwiches, Inc	Corsica	SD	-98.407	43.424
G21377	Cargill Kitchen Solutions, Inc	Mason CIty	IA	-93.232	43.136
G21395	Fremont Farms of Iowa L.L.P.	Malcom	IA	-92.576	41.735
G2154	North Shore Foods LLC	Hopkins	MN	-93.396	44.929
G21597	Daybreak Foods, Inc.	Estherville	IA	-94.811	43.363
G21683	Deb El Food Products, LLC	New Hampton	IA	-92.317	43.068
G21931	Rembrandt Enterprises, LLC	Rembrandt	IA	-95.13	42.824
G21932	Sonstegard of Arkansas	Springdale	AR	-94.122	36.194
G24601	Ready Alliance Group, Inc	Salt Lake City	UT	-111.991	40.746
G2462	Ethnic Food Concepts, LLC	Olathe	KS	-94.805	38.848
G24681	Papetti's Hygrade Egg Products, Inc.	Klingerstown	PA	-76.697	40.66
G2543	TK America Inc.	Ontario	CA	-117.562	34.063
G2571	Bakehouse Enterprises, LLC, DBA Boxford Bakehouse	Plymouth	MA	-70.69	41.957
G2642	H.B. Taylor Co.	Chicago	IL	-87.708	41.805
G2665	Profile Food Ingredients	Elgin	IL	-88.307	42.057
G2671	United Foods International (USA) Inc.	Phoenix	AZ	-112.203	33.441
G2690	Flock Foods, LLC	Santa Fe Springs	CA	-118.052	33.94
G2879	Pearson Foods Corporation	Grand Rapids	MI	-85.64	42.907
G309	Garden Fresh Beef Jerky, Inc.	Garden Grove	CA	-117.946	33.774
G31354N	Grand Prairie Foods, Inc.	Sioux Falls	SD	-96.749	43.567
G31538	Center Fresh Egg Farm L.L.P.	Sioux Center	IA	-96.237	43.051
G31540	Hickman's Egg Ranch, Inc.	Arlington	AZ	-112.749	33.365
G31542	Texas Egg Products LLC	Waelder	TX	-97.28	29.691
G31544	Blue Chip Group	Salt Lake City	UT	-111.982	40.73
G31546	New Day Farms, LLC	Raymond	OH	-83.453	40.394
G31547	New Day Farms, LLC - Farm 3	West Mansfield	OH	-83.487	40.39
G31548	Michael Foods Inc.	Britt	IA	-93.741	43.103
G31551A	Thrive Life	American Fork	UT	-111.787	40.345
G31556	Hawkeye Pride Egg Farm LLP	Corwith	IA	-93.914	42.948
G31896M	Universal Pure, LLC	Malvern	PA	-75.557	40.067
G32004	American Pasteurization Company	Milwaukee	WI	-88.052	43.071
G3377	Vodes Preparedness LLC	Dalbo	MN	-93.409	45.658
G339	Oskaloosa Food Products Corp.	Oskaloosa	IA	-92.639	41.287
G34595	Fair Market Inc.	Montgomery City	MO	-91.494	38.96
G34777	Forsman Farms, Inc.	Howard Lake	MN	-94.087	45.059
G3506	Tink's Tonic, LLC	Statesboro	GA	-81.819	32.394
G3680	REI Enterprises, LLC	New Hampton	IA	-92.332	43.063
G3691	Wow Bao LLC	Forest City	NC	-81.841	35.336
G3748	Stampede Culinary Partners, Inc.	Bridge View	IL	-87.812	41.758
G3860	Central Storage & Warehouse Co., Inc.	Eau Claire	WI	-91.546	44.853
G3862	Evergreen Refreshments	Spokane	WA	-117.253	47.677
G3978	Wasatch Freeze Dry	West Jordon	UT	-111.992	40.601
G40031	ACC Central Kitchen LLC	Thorofare	NJ	-75.19	39.838
G40238	Correctional Industries Food Factory	Airway Heights	WA	-117.577	47.654
G40316B	CalChef Foods, LLC	Stockton	CA	-121.218	37.91
G4138	Green Plant LLC	Miami	FL	-80.369	25.915
G4139	Green Plant LLC	Miami	FL	-80.255	25.828
G420	M.G. Waldbaum Company	Wakefield	NE	-96.864	42.273
G420D	M.G. Waldbaum Company	Wakefield	NE	-96.861	42.27
G420G	Husker Pride Farms MG Waldbaum Co.	Wakefield	NE	-96.881	42.308
G420L	Big Red Farms	WAKEFIELD	NE	-96.819	42.293
G420M	Bloom-N-Egg Farm	Bloomfield	NE	-97.705	42.597
G45009	Readywise Inc.	Salt Lake City	UT	-111.969	40.737
G45031	Cheesewich LTD	Hodgkins	IL	-87.86	41.767
G45170	Marchiano's Bakery LLC	Philadelphia	PA	-75.225	40.031
G45262	The Kitchen Inc.	Sterling Heights	MI	-83.041	42.554
G45381	Cooper Farms Liquid Egg Products	Ft. Recovery	OH	-84.776	40.419
G45510	Queen City Fresh Foods, LLC	Lackawanna	NY	-78.846	42.817
G45517	Trailtopia LLC	Byron	MN	-92.659	44.029
G45617	Nathan's Soup & Salad	Rochester	NY	-77.614	43.089
G45702	Chino Valley Ranchers	Colton	CA	-117.325	34.086
G45997	Brooke & Bradford LLC	Salt Lake City	UT	-111.971	40.753
G46236	F & S Fresh Foods	Conley	GA	-84.318	33.637
G46373	Cargill Kitchens Solutions, Inc.	Big Lake	MN	-93.716	45.333
G46493	New Day Farms, LLC	Croton	OH	-82.694	40.187
G46528	Pine Valley Ranch LLC	Spencerville	OH	-84.421	40.666
G46611	Daybreak Foods, Inc.	Lake Mills	WI	-88.943	43.039
G46612	Midwest Kitchens	Kenosha	WI	-87.893	42.591
G46630	Modernist Pantry, LLC	Eliot	ME	-70.763	43.122
G46780	Michael Foods Egg Products Company	Norwalk	IA	-93.689	41.462
G46913	Nurture Life, Inc.	Bedford Park	IL	-87.794	41.773
G47106	AbE Manufacturing	Waterloo	WI	-88.977	43.192
G47171	Fishtail Food Distributing	Fishtail	MT	-109.504	45.453
G47192	OFD Foods, LLC	Albany	OR	-123.107	44.618
G47419	Cinnamonster Franchise Group, Inc.	Palmer Lake	CO	-104.878	39.099
G47523	TPM Foodservice LLC	Solon	OH	-81.467	41.381
G47540	Premier Freeze Dry	West Haven	UT	-112.026	41.206
G47552	Kitchen Majgek LLC	Lafayette	LA	-92.072	30.231
G47808	Evermade Foods LLC	Warrenton	VA	-77.679	38.75
G47819	Daybreak Foods, Inc.	Eagle Grove	IA	-93.906	42.684
G47974	Crystal Freeze Dry	Panora	IA	-94.362	41.687
G48139	Egg 24-7	Canoga Park	CA	-118.595	34.193
G4933	American Outdoor Products, Inc	Boulder	CO	-105.206	40.07
G496	Estherville Foods, Inc.	Estherville	IA	-94.84	43.403
G614	Trillium Farms	Harpster	OH	-83.36	40.691
G6147	Overhill Farms, Inc.	Vernon	CA	-118.224	34.006
G778	Daybreak Foods, Inc.	Eagle Grove	IA	-93.948	42.595
G779	Sonstegard Foods of Georgia	Gainesville	GA	-83.857	34.268
G783	Wabash Valley Produce, Inc	Zanesville	OH	-82.01	39.941
G7875	Joe Jurgielewicz & Son, Ltd.	Hamburg	PA	-76.02	40.526
G7875A	Joe Jurgielewicz & Son, Ltd.	Leesport	PA	-75.956	40.443
G86X	Cargill Meat Solutions, Corp.	Wichita	KS	-97.341	37.689
G878	Dimension Marketing and Sales, Inc.	Sandy	UT	-111.903	40.581
G900	Centrum Valley Farms L.L.P.	Dows	IA	-93.606	42.603
G926	Trillium Farms - Layer # 5	Mount Victory	OH	-83.441	40.529
G94	Henningsen Foods, Inc	Norfolk	NE	-97.41	42.037
I1	Lineage Logistics PFS, LLC	AVENEL	NJ	-74.257	40.579
I10	Atlantic Coast Freezers LLC	Vineland	NJ	-75.025	39.518
I101	Lineage Logistics, LLC	Seattle	WA	-122.38	47.633
I102	Cool Port Oakland	Oakland	CA	-122.32	37.803
I103	Northwestern Selecta, Inc.	San Juan	PR	-66.097	18.415
I1036	Americold Logistics LLC.	Vineland	NJ	-75.066	39.513
I105	MTC Logistics, Inc.	Mobile	AL	-88.046	30.666
I107	Jose Santiago, Inc.	Bayamon	PR	-66.139	18.427
I109	Isla Frio Refrigeration Corporation	Cidra	PR	-66.158	18.172
I11	Dynamic Ventures Inc.	Harmon	GU	144.809	13.5
I111	Detroit Cold Storage	Livonia	MI	-83.344	42.38
I112	Lineage Logistics PFS, LLC	Logan Township	NJ	-75.347	39.789
I113	San Rafael Distributing, Inc.	Nogales	AZ	-110.956	31.355
I114	Konoike Pacific California, Inc.	Wilmington	CA	-118.241	33.794
I115	Nital Trading Co Inc	Hialeah	FL	-80.372	25.927
I116	Celebrity Foods Division of Atalanta Corporation	Elizabeth	NJ	-74.176	40.651
I119	Supermercados Econo, Inc.	Canovanas	PR	-65.904	18.375
I121	RSF Inc. "DBA" Freezpak Logistics	Elizabeth	NJ	-74.203	40.687
I123	Lineage Logistics, LLC	Portsmouth	VA	-76.343	36.863
I124	Lineage Logistics, LLC	Savannah	GA	-81.143	32.061
I12457	Higa Foodservice	Honolulu	HI	-157.901	21.333
I125	Envision Cold	San Francisco	CA	-122.393	37.724
I126	Theriault's Abattoir, Inc.	Hamlin	ME	-67.906	47.136
I129	Sorbello Refrigerated Services	Vineland	NJ	-74.991	39.508
I13	Delaware Avenue Enterprises, Inc.	Philadelphia	PA	-75.14	39.903
I130	JE Exports	Calexico	CA	-115.378	32.676
I133	Port of Palm Cold Storage Inc.	Riviera Beach	FL	-80.085	26.77
I135	Derstine's, Inc., EZ3PL	Telford	PA	-75.317	40.338
I138	Atkins Sheep Ranch, Inc.	Fremont	CA	-121.988	37.516
I140	Interstate Warehousing	Newport News	VA	-76.59	37.178
I141	Lineage Logistics, LLC	Seattle	WA	-122.339	47.542
I143	Americold Logistics LLC	Tacoma	WA	-122.393	47.246
I145	Kukui Meat	Honolulu	HI	-157.881	21.326
I149	Lineage Logistics Services, LLC	Long Beach	CA	-118.217	33.777
I15	NOCS West Gulf	La Porte	TX	-95.069	29.699
I1509A	Atlantic Veal & Lamb Inc	Brooklyn	NY	-73.935	40.714
I151	FlexCold, LLC	Jacksonville	FL	-81.573	30.435
I153	Micronesian Brokers, Inc.	Maite	GU	144.769	13.476
I154	Livingston International, Inc.	Pembina	ND	-97.253	48.966
I16	Americold Logistics	Carson	CA	-118.243	33.808
I1651	RSF Inc dba FreezPak Logistics	Woodbridge	NJ	-74.274	40.585
I168	Goya Foods, Inc.	Jersey City	NJ	-74.065	40.76
I17	Lineage Logistics PFS, LLC	Philadelphia	PA	-75.153	39.907
I171	Yaong Corporation Rem Center Warehouse	Saipan	MP	145.76	15.204
I17202S	Americold Logistics LLC	Sanford	NC	-79.214	35.518
I1726	Tomoe Food Services, Inc.	Bronx	NY	-73.872	40.807
I173	50th State Poultry	Pearl City	HI	-157.956	21.392
I17993	Lineage Logistics, LLC	Sandston	VA	-77.344	37.508
I18	Envision Cold	El Paso	TX	-106.292	31.715
I180	Timberline Cold Storage, Inc.	Sewell	NJ	-75.112	39.745
I1809	Catelli Brothers Inc.	Collingswood	NJ	-75.089	39.922
I1811	Sorbello Refrigerated Services	Houston	TX	-95.564	29.725
I182	Americold	Mullica Hill	NJ	-75.255	39.721
I185	Malgor & Co.	Catano	PR	-66.12	18.441
I1892	Sierra Pacific Refrigerated Services	Patterson	CA	-121.123	37.469
I19	Lineage Logistics PFS, LLC	San Leandro	CA	-122.152	37.714
I190	DSI Warehouse Services, Inc.	Houston	TX	-95.384	29.688
I193	Quirch Foods Company	Medley	FL	-80.333	25.843
I196	Maersk Logistics & Services USA Inc.	Ridgeville	SC	-80.283	33.141
I197	Lineage Logistics LLC	Norfolk	VA	-76.329	36.93
I2	Sorbello Warehouse Services , LLC	Woodstown	NJ	-75.322	39.657
I20	Versacold Texas, LP	La Porte	TX	-95.018	29.67
I20124	W.T. Distributors, Inc.	Calexico	CA	-115.506	32.695
I20485	G&C Food Distributors, Inc.	Syracuse	NY	-76.277	43.107
I2051	Levoni America Corporation	Millville	NJ	-75.066	39.372
I2056	Global Freight Solutions, Inc.	Carson	CA	-118.25	33.867
I207	T.C. Trading Company, LLC	Blaine	WA	-122.728	48.99
I209	Zazules Investment LLC	Bayamon	PR	-66.161	18.399
I21	Summit Cold Storage	Summit	IL	-87.812	41.792
I2142	Maersk Warehousing & Distribution Services USA, LLC	Wilmington	NC	-78.016	34.341
I21467	United Source One, Inc.	Belcamp	MD	-76.23	39.476
I2152	Agile Cold Claymont LLC	Claymont	DE	-75.448	39.814
I2175	RSF, Inc., DBA FreezPak Logistics	Philadelphia	PA	-75.107	39.991
I21935	Suffolk Cold Storage	Suffolk	VA	-76.477	36.814
I22	Melrose Storage and Distribution, Inc.	Sayreville	NJ	-74.305	40.483
I2204	Froods International Warehouse and Distribution LLC	Tucson	AZ	-110.951	32.209
I2234	Lineage Logistics, LLC	Houston	TX	-95.181	29.834
I224	Caguas Warehouse LLC	Caguas	PR	-66.039	18.224
I226	Berkshire Refrigerated Warehousing, LLC	Chicago	IL	-87.659	41.812
I229	Vertical Cold Storage, LLC	Medley	FL	-80.368	25.874
I235	Lineage Logistics, LLC	Algona	WA	-122.246	47.291
I2395	D&T Foods Inc.	Santa Clara	CA	-121.954	37.368
I2406	A&I Logistic Inc.	South Gate	CA	-118.172	33.933
I252	Department of Agriculture - Plant & Animal Quarantine Division American Samoa Government	Pago Pago	AS	-170.718	-14.323
I255	Pacific Transload Systems DBA Pacific Coast Container, Inc.	Oakland	CA	-122.307	37.817
I2574D	Wolverine Packing Company	Detroit	MI	-83.043	42.358
I258	Seaonus Cold Storage -- Jacksonville LLC	Jacksonville	FL	-81.709	30.346
I26	Lakeside Refrigerated Services	Swedesboro	NJ	-75.376	39.75
I261	J.C. Tenorio Ent., Inc.	Saipan	MP	145.704	15.157
I264	U.S. Import Meat Inspection	Sweet Grass	MT	-111.969	48.995
I265	Freezer Services of Michigan, L.L.C.	Hamtramck	MI	-83.056	42.384
I267	Goya de Puerto Rico, Inc.	Bayamon	PR	-66.144	18.413
I271	A. N. Deringer, Inc.	Champlain	NY	-73.455	45.003
I2729	Mexus Cold Storage	Laredo	TX	-99.48	27.684
I27373	The Classic Jerky Company	Taylor	MI	-83.247	42.262
I27453	New Orleans Cold Storage & Warehouse Company, Ltd.	New Orleans	LA	-90.016	29.997
I2767B	Lone Crow Meat Processing LLC	Eltopia	WA	-119.022	46.481
I277	Jacob Fleishman Cold Storage	Miami	FL	-80.217	25.85
I2783	FreezPak Logistics	Baytown	TX	-94.865	29.73
I28	Luen Fung Enterprises	Harmon	GU	144.813	13.504
I2857	Agile Cold Storage Joliet LLC	Joliet	IL	-88.031	41.496
I2921	GDC Cold, Inc.	Laredo	TX	-99.473	27.683
I2988	Americold LLC	Kansas City	MO	-94.55	38.855
I3	Northwestern Selecta, Inc.	San Juan	PR	-66.096	18.416
I30	F&C&R Investment Corporation	Caguas	PR	-66.029	18.228
I301	Total Distribution Inc.	Jacksonville	FL	-81.745	30.334
I303	Northwestern Meat, Inc.	Miami	FL	-80.23	25.798
I3072	Winchester Cold Storage	Winchester	VA	-78.149	39.199
I31	Lineage Logistics PFS, LLC	Chesapeake	VA	-76.338	36.767
I310	MEDLOG Cold Storage Savannah LLC	Rincon	GA	-81.232	32.292
I311	Jose G. Flores, Inc.	Guaynabo	PR	-66.118	18.4
I3110	Ray S. F., Inc DBA, FreezPak Logistics	Los Angeles	CA	-118.215	34.016
I313	Colorado Box Beef	Port Everglades	FL	-80.121	26.085
I319	Ballester Hermanos, Inc.	Catano	PR	-66.137	18.429
I3196	3200 Clinton St., LLC	West Seneca	NY	-78.763	42.86
I3201	Maestri d'Italia Inc.	Vineland	NJ	-75.055	39.521
I3213	GMR Freezer & Cold Storage	Vineland	NJ	-75.057	39.504
I327	Mendez & Co., Inc.	Catano	PR	-66.146	18.424
I3271	Americold Logistics	Vineland	NJ	-75.061	39.489
I33	Payless Distribution Center (PDC)	Dededo	GU	144.825	13.502
I3312	JE Exports	San Diego	CA	-116.954	32.572
I3322	FreezPak Logistics Suffolk	Suffolk	VA	-76.474	36.818
I3335	Coyotarts, LLC	SAN DIEGO	CA	-116.979	32.558
I3358	Agile Cold New Orleans LLC	Pearl River	LA	-89.755	30.366
I336	KRES Cold Storage , LLC	Vineland	NJ	-75.06	39.54
I341	Hidalgo Logistics LLC	Hidalgo	TX	-98.25	26.109
I34311	Paden Cold Inc.	Norfolk	VA	-76.208	36.842
I34569	Ohio Farms Packing Co. Ltd.	Creston	OH	-81.918	40.984
I34582	Lineage Logistics PFS, LLC	College Park	GA	-84.407	33.616
I36	Lineage Logistics, LLC	Jacksonville	FL	-81.687	30.333
I3632	Ya YA Foods USA LLC	Ogden	UT	-111.998	41.268
I365	Arcadia Cold Charleston, LLC	Ridgeville	SC	-80.315	33.11
I366	John R White Company, Inc	Birmingham	AL	-86.848	33.446
I3674	Customized Distribution Services, Inc.	Allentown	PA	-75.429	40.666
I37	Lineage Logistics PFS, LLC	La Porte	TX	-95.075	29.696
I371	Agile Cold Storage Macon, LLC	Macon	GA	-83.543	32.813
I3732	Kotick Cold JV, LLC	Laredo	TX	-99.491	27.611
I375	Triple J Five Star Wholesale Foods, Inc	Dededo	GU	144.891	13.542
I3754	Cold Chain Solutions, LLC	Laredo	TX	-99.476	27.62
I3770	Southwind Foods	Vernon	CA	-118.219	34.0
I3835	Logan Refrigerated Services, LLC	Logan Township	NJ	-75.381	39.764
I3837	FreezPak Logistics	Fall River	MA	-71.094	41.76
I3858	Lineage Logistics PFS, LLC	Raynham	MA	-71.02	41.902
I3865	Arcadia Cold Chicago, LLC	Joliet	IL	-88.072	41.452
I387	JNP Hawaii LLC	Honolulu	HI	-157.887	21.326
I39	VERTICAL COLD STORAGE, LLC	Pooler	GA	-81.248	32.166
I3909	JBS Tolleson Inc.	Tolleson	AZ	-112.254	33.442
I391	FreezPak Logistics	Jacksonville	FL	-81.634	30.4
I393	Maersk Logistics & Services USA Inc.	Baytown	TX	-94.891	29.74
I3997	Mexus Cold Storage	Laredo	TX	-99.481	27.682
I39973	Price Smart, Inc.	Miami	FL	-80.375	25.864
I39993	Port of Palm Cold Storage	Riviera Beach	FL	-80.085	26.77
I4	Broadleaf Inc.	Vernon	CA	-118.237	33.991
I401	Americold Logistics LLC	Lula	GA	-83.727	34.376
I4010	Euro Food, Inc., DBA Citterio USA Corporation	Freeland	PA	-75.899	41.011
I412	Trafon Group Inc.	San Juan	PR	-66.101	18.428
I417	ECI storage & logistics, inc	Williamstown	NJ	-75.006	39.676
I4177	Leyen Food, LLC	La Puente	CA	-117.989	34.029
I42	Laredo Cold Storage	Laredo	TX	-99.72	27.719
I4201	STX Beef Company, LLC	Corpus Christi	TX	-97.539	27.822
I422	Piatkowski Riteway Meats Inc.	Niagara Falls	NY	-79.015	43.129
I430	Envision Cold	Savannah	GA	-81.22	32.112
I44814	Aufschnitt Meats LLC	Owings Mills	MD	-76.781	39.414
I45	Lineage Logistics	North Charleston	SC	-80.071	32.941
I450	Continental Forwarding Services, Inc.	Laredo	TX	-99.632	27.654
I45544	Northeast Prime Veal, LLC	Taylor	PA	-75.702	41.399
I45671	Cool Port Oakland	Oakland	CA	-122.32	37.803
I45773A	International Meat Processor SF	San Francisco	CA	-122.394	37.725
I45925	Frigopack USA Inc	Elizabeth	NJ	-74.197	40.672
I45986	Brothers Quality Halal Meat, LLC	Paterson	NJ	-74.149	40.894
I46	PG Distribution LLC	Laredo	TX	-99.529	27.604
I46124	Cross Partners Cold Storage Inc.	San Diego	CA	-116.979	32.555
I46198	Valley Cold Storage & Transportation, LLC	Santa Teresa	NM	-106.703	31.872
I46585	Leader Meat Packing Corp.	Chesterfield	NJ	-74.631	40.07
I47	A. N. Deringer, Inc.	Sweetgrass	MT	-111.968	48.997
I47009	Smithfield Distribution, LLC	North East	MD	-75.992	39.598
I47405	Savello USA, Inc.	Hanover Township	PA	-75.934	41.226
I47473	Rovagnati North America LLC	Vineland	NJ	-75.068	39.508
I47475	TDI	Bayonne	NJ	-74.106	40.664
I47516	Winchester Cold Storage	Winchester	VA	-78.152	39.198
I47517	Winchester Cold Storage	Winchester	VA	-78.163	39.194
I47798	Best Deal Brokerage LLC	Vernon	CA	-118.183	34.0
I47958	Americold Logistics, LLC	Baytown	TX	-94.888	29.726
I47993	Mason Hills LLC	Grand Bay	AL	-88.318	30.451
I48	Lineage Logistics PFS, LLC	Chicago	IL	-87.677	41.846
I49	Lineage Logistics PFS, LLC	Everett	MA	-71.055	42.391
I499	Davy Cold Storage	Vineland	NJ	-75.062	39.521
I5	Americold Logistics LLC	Summerville	SC	-80.19	33.067
I51	Midway International Logistics LLC	Watertown	NY	-75.915	43.992
I51264	Port of Wilmington Cold Storage	Wilmington	NC	-77.95	34.191
I513	Lineage Logistics PFS, LLC	Medley	FL	-80.384	25.891
I515	United States Cold Storage, LP	Laredo	TX	-99.51	27.553
I517	Lineage Logistics PFS, LLC	Wilmington	CA	-118.252	33.788
I52	Fresh Island Fish Co., Inc.	Honolulu	HI	-157.874	21.316
I521	Lineage Logistics MTC, LLC	New Castle	DE	-75.54	39.712
I526	Pilot Water Tower Cold Storage	Vernon	CA	-118.219	34.011
I53	Matosantos Comercial	Vega Baja	PR	-66.387	18.448
I530	RLS Cold Storage, Inc.	Newfield	NJ	-75.007	39.575
I531	RSF Inc dba FreezPak Logistics	Philadelphia	PA	-75.107	39.991
I532	Lineage Logistics PFS, LLC	Newark	NJ	-74.129	40.723
I536	NEP Cold Storage, Inc.	Philadelphia	PA	-75.013	40.093
I539	Alameda Distribution, Inc.	Commerce	CA	-118.188	34.015
I54	Weighmasters Murphy, Inc.	Long Beach	CA	-118.214	33.782
I54264	Cordele Cold Storage & Food Processing, LLC	Cordele	GA	-83.74	31.969
I543	G&C Food Distributors & Brokers, Inc.	Syracuse	NY	-76.277	43.107
I56	Londonderry Freezer Warehouse LLC	Londonderry	NH	-71.39	42.911
I58	Lineage Logistics - Vernon Area #2	Vernon	CA	-118.21	34.004
I6	Lineage Logistics PFS, LLC	Vernon	CA	-118.173	33.998
I608	Pacific Produce Corporation	Tamuning	GU	144.81	13.502
I61	Lineage Logistics PFS, LLC	Chicago	IL	-87.671	41.849
I613	Vaillancourt Inspection Inc.	Van Buren	ME	-67.941	47.17
I616	Lineage Logistics MTC, LLC	Baltimore	MD	-76.554	39.269
I62	Piazza's Seafood World, LLC	St. Rose	LA	-90.286	29.988
I620	SR Forwarding, Inc.	Laredo	TX	-99.718	27.719
I621	Mendez & Co. Cold Storage Logistics	Guaynabo	PR	-66.101	18.408
I625	Quirch Foods Carribean, Inc.	San Juan	PR	-66.101	18.413
I629	International Express, Inc.	Honolulu	HI	-157.91	21.335
I630	Ballester Hermanos Inc.	Dorado	PR	-66.272	18.46
I631	QF Southeast, LLC	Winter Haven	FL	-81.732	27.989
I634	Marvel International inc	Guaynabo	PR	-66.112	18.418
I64	Luen Fung Enterprises (Saipan), Inc.	Saipan	MP	145.719	15.196
I65	Kearny Cold Storage	Kearny	NJ	-74.133	40.768
I655	Premier Distribution Center, LLC	Nogales	AZ	-110.961	31.348
I658	Palos Garza Forwarding	Laredo	TX	-99.51	27.611
I66	Lineage Logistics PFS, LLC	Pasadena	TX	-95.08	29.61
I663	Sea World Inc	Guaynabo	PR	-66.12	18.418
I669	Americold Logistics LLC	Pedricktown	NJ	-75.411	39.74
I67	Preferred Freezer of Elizabeth, LLC	Elizabeth	NJ	-74.203	40.638
I670	JE EXPORTS	Calexico	CA	-115.502	32.674
I68	H&N Group, Inc.	Vernon	CA	-118.237	33.993
I680	Lineage Logistics PFS, LLC	Houston	TX	-95.247	29.825
I6810A	Meats By Linz	Hammond	IN	-87.513	41.627
I682	New Orleans Cold Storage & Warehouse Co. Ltd.	Charleston	SC	-79.98	32.902
I683	Elore Enterprises, LLC	Miami Gardens	FL	-80.219	25.921
I686	Americold Logistics LLC	Chesapeake	VA	-76.371	36.78
I69	Intactics LLC	Nogales	AZ	-110.961	31.394
I7	Americold Logistics, LLC	Compton	CA	-118.222	33.849
I70	Seafrigo Coldstorage Miami Inc	Miami	FL	-80.305	25.803
I72	RSF Inc. DBA Freezpak Logistics	Carteret	NJ	-74.216	40.566
I729	World Class Distributions	Ruther Glen	VA	-77.461	37.935
I734	Arcadia Cold Jacksonville, LLC	Jacksonville	FL	-81.65	30.415
I74	Lineage Logistics PFS, LLC	Lynden	WA	-122.498	48.944
I76	San Luis International Cold Storage Services LLC	San Luis	AZ	-114.693	32.464
I7877C	Rastelli's Export	South Harrison Twp	NJ	-75.255	39.721
I79	Palama Holdings LLC	Kapolei	HI	-158.091	21.324
I8	Envision Cold	Oakland	CA	-122.188	37.751
I80	Lineage Logistics - Vernon Area #8	Vernon	CA	-118.219	34.004
I81	Lineage Logistics PFS, LLC	Kearny	NJ	-74.131	40.752
I83	B.Y. International Inc.	City of Industry	CA	-117.898	34.002
I85	Global Trading Enterprises LLC, DBA Rastelli Global	Swedesboro	NJ	-75.365	39.769
I869	RSF Inc. DBA FreezPak Logistics	Hialeah	FL	-80.364	25.921
I87	Carson Guam Corporation	Tamuning	GU	144.809	13.502
I88	New XO Market/Wholesale	Saipan	MP	145.719	15.185
I89	Lineage Logistics PFS, LLC	Jacksonville	FL	-81.741	30.33
I90	Vertical Cold Storage LLC	Canton	MI	-83.449	42.275
I91	Pacific Grocers	Barrigada	GU	144.824	13.492
I914	Sea Win, Inc.	City of Industry	CA	-117.94	34.004
I93	Lineage Logistics PFS, LLC	Hialeah	FL	-80.365	25.919
I95	Royal Foods Distribution	Santa Clara	CA	-121.96	37.365
I963	RSF Inc. dba FreezPak Logistics	Bedford Park	IL	-87.75	41.765
I97	Cold Terminal of Laredo LLC	Laredo	TX	-99.481	27.618
I99	Americold Logistics, LLC	Bloomingdale	GA	-81.386	32.128
M1	Vienna Beef Ltd.	Chicago	IL	-87.652	41.824
M10	Buckhead Meat & Seafood of Houston.	Houston	TX	-95.418	29.917
M10001	Koegel Meats, Inc.	Flint	MI	-83.747	42.974
M10002	Dearborn Sausage Company Inc	Dearborn	MI	-83.147	42.304
M1001	Evans Food Group	Portsmouth	OH	-82.971	38.734
M10017	Bert Hazekamp & Son Inc.	Muskegon	MI	-86.149	43.18
M1002	Borracho Products LLC	Canutillo	TX	-106.594	31.909
M10026	Hillsdale County Meats	Waldron	MI	-84.426	41.706
M10031	Ada Valley Gourmet Foods	Ada	MI	-85.515	42.962
M10038	Scotts Hook & Cleaver Inc.	Scotts	MI	-85.393	42.192
M1004	Smart Food Systems, LLC	Camuy	PR	-66.883	18.468
M10040	Milton Chili Co.	Madison Heights	MI	-83.103	42.528
M10047	Rainbow Packing Inc.	Escanaba	MI	-87.191	45.798
M10053	Michigan State University Dept of Animal Science	East Lansing	MI	-84.479	42.725
M1006	Spar Sausage Company	San Leandro	CA	-122.159	37.718
M10061	Weltin Meat Packing Inc.	Minden City	MI	-82.769	43.677
M10062	Northside Noodle Co	Iron Mountain	MI	-88.057	45.829
M1007	Cherokee Nation Meat Processing, LLC	Tahlequah	OK	-95.056	35.917
M10072	Kowalski Companies, Inc.	Hamtramck	MI	-83.059	42.392
M1009A	Michael Angelo's Gourmet Foods Inc.	Austin	TX	-97.677	30.472
M101	Hickory Baked Ham Company Inc.	Castle Rock	CO	-104.871	39.409
M10100	Albie's Food Products, LLC	Gaylord	MI	-84.693	45.011
M10102	A. Gemmen & Sons, Inc.	Allendale	MI	-85.954	42.976
M10103	Berghorst Farms	Fremont	MI	-85.881	43.513
M10105	Smith Meat Packing, Inc.	Port Huron	MI	-82.467	42.968
M10105A	Smith Meat Packing, Inc.	Port Huron	MI	-82.435	42.991
M10113	El Acapulco Tamales LLC	Burt	MI	-83.897	43.236
M10114	C. Roy, Inc.	Yale	MI	-82.789	43.122
M10116	Mello Meats Inc.	Sterling Height	MI	-83.046	42.561
M10130	Kenosha Beef International, Ltd.	Columbus	OH	-83.122	39.991
M10130A	Kenosha Beef International, Ltd.	Columbus	OH	-83.122	39.994
M10136	KLP Specialty Food	Detroit	MI	-83.156	42.403
M10139	T. Wigley, Inc.	Detroit	MI	-83.042	42.353
M1014	Carl Buddig and Co	South Holland	IL	-87.619	41.595
M10147	Countryside Quality Meats LLC	Union City	MI	-85.129	42.055
M1014B	Carl Buddig & Company	South Holland	IL	-87.623	41.593
M1015	Empire Kosher Poultry, Inc.	Mifflintown	PA	-77.398	40.56
M10158	Winter Sausage Manufacturing Company Inc.	Eastpointe	MI	-82.962	42.46
M10165	Louie's Meats	Traverse City	MI	-85.624	44.716
M10176	Jones Butchering and Meat Processing, LLC	Saranac	MI	-85.233	42.979
M10195	Bernthal Packing Inc.	Frankenmuth	MI	-83.771	43.335
M10198	Dave's Sausage Factory, Inc.	Dearborn	MI	-83.148	42.303
M10203	A&R PackingCo., Inc.	Livonia	MI	-83.381	42.38
M10219	E.W. Grobbel Sons, Inc.	Detroit	MI	-83.037	42.347
M10226	DeVries Meats	Coopersville	MI	-85.988	43.091
M10227	Plath's Meats Inc.	Rogers City	MI	-83.815	45.419
M10249	Zalack's Flint Provision, Inc.	Flint	MI	-83.648	43.004
M1025	5R Custom Meats	Mt. Vernon	AR	-92.092	35.226
M10251	Ernst Hotel Supply Co.	Detroit	MI	-83.04	42.349
M10252	Berry & Sons Rababeh Isl Slau	Detroit	MI	-83.037	42.347
M10256	E & H Packing Co, Inc.	Detroit	MI	-83.038	42.346
M10259	Kern's Sausages Inc.	Frankenmuth	MI	-83.741	43.322
M10266	Detroit Sausage Company, Inc.	Detroit	MI	-83.035	42.35
M10269	Jos. Sanders, Inc.	Custer	MI	-86.219	43.95
M10270	The Meat Block, Inc.	Muskegon	MI	-86.187	43.202
M1030	Manna Asian Foods LLC	Indianapolis	IN	-86.13	39.666
M10301	Walsh Packing Company	Pigeon	MI	-83.282	43.829
M10306	Michigan Brand, Inc.	Bay City	MI	-83.88	43.576
M10306F	Michigan Brand Inc.	Frankenmuth	MI	-83.732	43.316
M10307	J.G. Food Products, Inc.	Shelby Township	MI	-82.986	42.677
M10312	Balkan Meat Inc.	Detroit	MI	-83.025	42.439
M10315	Athena Foods	Southfield	MI	-83.278	42.459
M1037	Michael's Provision	Fall River	MA	-71.152	41.721
M104	OSI Industries, LLC	West Chicago	IL	-88.232	41.894
M1041	Cool Springs Farm and Meat LLC	yadkinville	NC	-80.658	36.094
M1044G	OSI Industries, LLC	Geneva	IL	-88.269	41.894
M1045	Nestle Professional	Cleveland	OH	-81.698	41.476
M1046	S & S Meat Co.	Kansas City	MO	-94.552	39.118
M104I	OSI Industries, LLC	Oakland	IA	-95.387	41.33
M104U	OSI Industries, LLC	West Jordan	UT	-112.01	40.579
M105	US Foods, Inc.	Aurora	IL	-88.285	41.808
M1050	Fernandez Meat Processing LLC	Calhoun	GA	-84.943	34.52
M1050C	Fernandez Meat Processing LLC	Calhoun	GA	-84.943	34.521
M1051	Velmar Foods	Phoenix	AZ	-112.141	33.493
M1052	Georgia Premium Meats	Colquitt	GA	-84.784	31.24
M1053	Longhorn Barbecue Production Center	Spokane	WA	-117.265	47.68
M1055	Rudolph Foods Company, Inc.	Lima	OH	-83.982	40.696
M1056	AIA USA	Harrisonburg	VA	-78.868	38.456
M1058	ConAgra Brands, Inc.	Council Bluffs	IA	-95.85	41.251
M1059	Conagra Brands (Conagra Foods Packaged Foods, LLC)	Marshall	MO	-93.199	39.122
M1060	Carnico Foods	Litchfield	MI	-84.759	42.032
M1061	Happy Valley Processing Inc.	Dearing	GA	-82.465	33.369
M10620	G.E. Hawthorn Meat Company, Inc.	Hot Springs	AR	-92.999	34.497
M10624	Arkansas Department of Corrections	Grady	AR	-91.584	34.052
M1063	Hawaii Beef Producers, LLC	Paauilo	HI	-155.368	20.039
M10646	Morrilton Packing Co.	Morrilton	AR	-92.712	35.172
M10647	Famous Chili, Inc.	Fort Smith	AR	-94.414	35.398
M1065	L&M Enterprises, Inc.	Saipan	MP	145.722	15.146
M10650	Key's Family Butcher Shop	Van Buren	AR	-94.336	35.479
M10669	Randall Meat Company, Inc.	Hot Springs	AR	-93.075	34.497
M107	Cuba Processing Plant, LLC	Cuba	MO	-91.406	38.202
M1074	Norpaco Inc.	Middletown	CT	-72.723	41.585
M10754	Brimhall Foods Co., Inc	Bartlett	TN	-89.813	35.208
M10757	Select Meats, Inc.	Kannapolis	NC	-80.611	35.531
M1077	Lincoln Provision, Inc	Chicago	IL	-87.647	41.825
M10787	MARYLAND CORRECTIONAL ENTERPRISES	HAGERSTOWN	MD	-77.715	39.557
M1079	Allen Brothers, Inc	Chicago	IL	-87.646	41.826
M10795	Manger Packing Corp.	Baltimore	MD	-76.659	39.285
M10799	Hemps, Inc.	Jefferson	MD	-77.538	39.362
M10800	Shriver Meats	Emmitsburg	MD	-77.293	39.686
M10801	A&W Country Meats, Inc.	Taneytown	MD	-77.174	39.659
M10804	Wagner Meats, LLC.	Mount Airy	MD	-77.149	39.382
M10805	Hamzah Slaughter House, LLC	Williamsport	MD	-77.825	39.607
M10808	Shuff Meat Inc.	Thurmont	MD	-77.435	39.569
M1081	Schiff's Food Service, Inc., DBA R&R Provision Company	Easton	PA	-75.228	40.69
M1082	Golden Boar Product Corp	Miami	FL	-80.314	25.796
M10821	Roma Gourmet Foods, LLC	Baltimore	MD	-76.53	39.287
M10822	Casa di Pasta, Inc.	Baltimore	MD	-76.603	39.287
M10825	Ostrowski's of Bank St.	Baltimore	MD	-76.591	39.287
M10828	Hillside Turkey Farm	Thurmont	MD	-77.408	39.629
M1083	Northern MN Meat Co.	Mt. Iron	MN	-92.74	47.49
M10835	Sudlersville Frozen Meat Locker	SUDLERSVILLE	MD	-75.855	39.188
M1085	Brown Packing Co., Inc.	Gaffney	SC	-81.664	35.068
M1085A	Brown Packing Co., Inc.	Gaffney	SC	-81.664	35.068
M1088	Midwestern Meats	Mesa	AZ	-111.738	33.416
M1097	Demakes Enterprises, LLC	Lynn	MA	-70.969	42.465
M1098	The Beautiful Pig, Inc.	Longview	WA	-122.945	46.134
M11	The Butchery Inc.	Danvers	MA	-70.96	42.596
M1100	Illinois Tamale Company	Chicago	IL	-87.735	41.984
M11027	Rammell Valley Pack	Tetonia	ID	-111.16	43.826
M11032	Northwest Premium Meats, LLC	Nampa	ID	-116.514	43.584
M11033	Wayguud Custom Meat LLC	Meridian	ID	-116.432	43.561
M1104	Romaine Empire, Inc., d/b/a Farmer's Fridge	Chicago	IL	-87.743	41.795
M11041	Saigon Gourmet LLC	San Jose	CA	-121.897	37.369
M11044	University of Idaho Meats Lab	Moscow	ID	-117.024	46.728
M11057	Harvest Food Products Co., Inc	Hayward	CA	-122.054	37.621
M11061	Meridian Meat and Sausage	Meridian	ID	-116.391	43.608
M11070	Mickelsen Pack	Blackfoot	ID	-112.375	43.182
M11072	Doug's Wholesale Meats	Shelley	ID	-112.133	43.369
M11077	Palama Holdings, LLC	Kapolei	HI	-158.091	21.324
M11078	Burris Logistics	Los Angeles	CA	-118.224	34.04
M1110	Sabormix LLC	Norcross	GA	-84.199	33.952
M1111	Delicious Specialty Foods Corp.	Peekskill	NY	-73.907	41.294
M11110	The Limestone Meathouse	Monticello	FL	-84.028	30.354
M11111	Bradley's Country Store	Tallahassee	FL	-84.116	30.598
M11113	Ali International Inc.	Orlando	FL	-81.242	28.524
M11115	South Marion Meats and Retail Market Inc.	Summerfield	FL	-82.121	29.022
M11116	Osteen Meat Service Inc.	Clermont	FL	-81.824	28.417
M1112	CG Family Foods	Agawam	MA	-72.62	42.086
M11122	Mesa Meat Processors Corp.	Hialeah	FL	-80.286	25.843
M11126	Balter Meat Company	Miami	FL	-80.394	25.649
M11132	Las Americas Frozen Foods Inc	Miami	FL	-80.211	25.798
M11133	Global Distributors	Miami	FL	-80.237	25.797
M11134	Lacoronela Meat Processing	Miami	FL	-80.21	25.863
M11138	US Foods, Inc.	Orlando	FL	-81.396	28.421
M11142	Food Parade	Brooksville	FL	-82.474	28.48
M11144	Pinellas Provision Corporation	St Petersburg	FL	-82.655	27.769
M11145	La Montina Inc D/B/A El Tigre	Miami	FL	-80.22	25.798
M1115	Textured Food Innovations, LLC	Carle Place	NY	-73.604	40.751
M11150	Argus Food Processing Corporation	Medley	FL	-80.35	25.869
M11154	La Autentica Foods LLC	Hialeah	FL	-80.329	25.893
M11159	Nettles Sausage Inc	Lake City	FL	-82.601	30.065
M1116	Sunny Savory	Long Island City	NY	-73.929	40.74
M11164	City Meat Company of Tampa Inc.	Tampa	FL	-82.485	28.004
M11168	Mobleys Custom Cut	McAlpin	FL	-82.886	30.121
M11169	Amaro Foods Enterprise Inc	Miami	FL	-80.228	25.797
M11179	Special America's BBQ Inc	Medley	FL	-80.385	25.872
M11181	Casa Sierra Farm	Wimauma	FL	-82.281	27.713
M11198	Johnston's Locker Plant, Inc.	Monticello	FL	-83.885	30.545
M112	Tyson Foods, Inc.	Green Forest	AR	-93.429	36.331
M11201	Kallis German Buthcer Shop Inc.	Port Charlotte	FL	-82.118	26.997
M11202	Los Vinaleros Catering	Hialeah	FL	-80.287	25.848
M11204	Amba Ham Company Inc.	Miami	FL	-80.19	25.837
M11205	Florida Country Inns Inc.	Hialeah	FL	-80.282	25.863
M1123	Travis Meats, Inc.	Powell	TN	-84.044	36.016
M1124	Detroit Chili Co.	Detroit	MI	-82.988	42.398
M1127A	M.G. Waldbaum Company	Lenox	IA	-94.565	40.869
M1128	Goya de Puerto Rico, Inc.	Bayamon	PR	-66.144	18.413
M112A	Tyson Foods, Inc.	Green Forest	AR	-93.429	36.33
M1130	B & P Meats, LLC	Brookville	PA	-79.1	41.182
M1132	Baja Foods, LLC	Chicago	IL	-87.642	41.819
M1133	Troyers Trail Bologna	Dundee	OH	-81.707	40.586
M1134	Yorks Butcher Shop	Barnesville	GA	-84.191	33.005
M1137A	Nestle Prepared Foods Company	Solon	OH	-81.47	41.405
M1140	Surlean Foods	Forest Park	GA	-84.383	33.63
M1144	Cordobes Foods LLC	Longmont	CO	-105.022	40.159
M1145	Fehdan Meat Processing LLC	Shawnee	OK	-96.983	35.387
M11504	T.L. Herring & Co.	Wilson	NC	-77.895	35.702
M11505	Vace Inc.	Gaithersburg	MD	-77.155	39.17
M11509	Bachoco OK Foods	Albertville	AL	-86.17	34.233
M1155	Circle F Farms Meat Processing	Baxley	GA	-82.363	31.785
M1156	T & LT Tamales, LLC	Flora	MS	-90.311	32.543
M1160	Rocker Bros. Meat & Provision Inc.	Inglewood	CA	-118.349	33.971
M1161	Burger's Ozark Country Cured Hams, Inc.	California	MO	-92.569	38.588
M1161B	Burgers' Ozark Country Cured Hams, Inc.	Springfield	MO	-93.217	37.237
M1162	M.C.I. Foods, Inc.	Compton	CA	-118.194	33.905
M1162A	M.C.I. Foods, Inc.	Santa Fe Springs	CA	-118.055	33.892
M1163	Unibright Foods, Inc.	Bell Gardens	CA	-118.139	33.966
M1164	Newport Meat Pacific Northwest	Portland	OR	-122.496	45.557
M1165	Food Benefit Company	Milwaukee	WI	-87.915	43.057
M1168	Smithfield Packaged Meats Corp.	Springfield	MA	-72.537	42.145
M1173	Big Valley Meats	Houston	MN	-91.573	43.845
M118	Maid-Rite Specialty Foods, Inc	Dunmore	PA	-75.611	41.435
M1184	A G Specialty Foods	Happy Valley	OR	-122.488	45.413
M1185	HRR Enterprises	LaPorte	IN	-86.708	41.633
M1196	G & W Hamery	Murfreesboro	TN	-86.395	35.848
M1198A	Omaha Steaks International Inc.	Omaha	NE	-96.056	41.217
M1212	Minnesota Meat Market	Minneapolis	MN	-93.271	45.002
M1213	Procesos Boricuas Inc.	Toa Baja	PR	-66.209	18.404
M1216	Mom's Meals	Oklahoma City	OK	-97.639	35.397
M1221W	Mary Ann's Speciality Foods, Inc.	Webster City	IA	-93.79	42.472
M1227	Great Lakes Packing Co., International, Inc.	Chicago	IL	-87.664	41.815
M1229	Katie's CPG LLC	St. Louis	MO	-90.396	38.681
M123	Smithfield Fresh Meats Corp.	Smithfield	VA	-76.631	36.99
M1230	The Suter Company, Inc.	Sycamore	IL	-88.692	41.992
M1233	Sterling Foods	San Antonio	TX	-98.479	29.549
M1234	Mountaire Farms Inc.	Siler City	NC	-79.45	35.732
M124	R M Felt's Packing Company	Ivor	VA	-76.896	36.909
M1242	Lucky Moon Enterprises LLC	Fort Jones	CA	-122.848	41.599
M12425	Aala Meat Market, Inc.	Honolulu	HI	-157.874	21.326
M12426	Andrade Slaughterhouse	Lawai Kauai	HI	-159.498	21.923
M12429	L. Kang Inc.	Honolulu	HI	-157.867	21.32
M12432	Medeiros Farms, Inc.	Kalaheo	HI	-159.528	21.922
M12435	Pacific Sausages Co. Inc.	Honolulu	HI	-157.884	21.325
M12436	Wong's Meat Market Holdings, LLC	Honolulu	HI	-157.876	21.306
M12437	Amor Nino Foods, Inc.	Honolulu	HI	-157.885	21.326
M1244	R.C. Provisions Inc.	Burbank	CA	-118.322	34.185
M12440	Kukui Sausage	Honolulu	HI	-157.881	21.333
M12442	Hawaiian Pastele Company LLC	Honolulu	HI	-157.869	21.324
M12444	Warabeya U.S.A., Inc.	Waipahu	HI	-158.01	21.388
M12445	Kulana Foods, Ltd.	Hilo	HI	-155.084	19.684
M12446	Golden Coin Food Industries	Honolulu	HI	-157.886	21.323
M12448	Nakasone Slaughterhouse	Pukalani	HI	-156.34	20.836
M12452	Young's Meat Market	Honolulu	HI	-157.865	21.317
M12453	Lee's Chop Suey, Inc.	Hilo	HI	-155.076	19.706
M12455	Sanchez Slaughterhouse	Kapaa Kauai	HI	-159.364	22.066
M12455A	Wailua Meat Company LLC	Kapaa Kauai	HI	-159.363	22.066
M12456	PNJ Sausage Hawaii Corporation	Kaneohe	HI	-157.805	21.418
M12457	Higa Foodservice	Honolulu	HI	-157.901	21.333
M1247	Heber Valley Meat	Heber City	UT	-111.421	40.48
M12473	Frank's Foods, Inc.	Hilo	HI	-155.1	19.68
M1259	Capitol Kitchen, LLC	Caldwell	ID	-116.633	43.659
M1260	Rich Products Corporation	Gallatin	TN	-86.453	36.384
M12603	Cameron's British Foods Inc	Cape Coral	FL	-81.953	26.698
M12604	Mulberry Farms Inc.	Gainesville	GA	-83.826	34.275
M12610	Productos El Jibarito	Morovis	PR	-66.389	18.308
M12612	Boar's Head Provisions Co., Inc.	Jarratt	VA	-77.524	36.827
M12612A	Boar's Head Provisions Co., Inc.	Petersburg	VA	-77.413	37.175
M12622	NAIVE LLC	Isabela	PR	-67.0	18.451
M12626	Hursey's BBQ Wholesale, Inc.	Elon	NC	-79.509	36.162
M12630	Polk's Meat Products, Inc.	Magee	MS	-89.757	31.874
M12641	CUSTOM FOODS OF AMERICA, INC.	Knoxville	TN	-83.972	35.977
M12648	Elore Enterprises, LLC	Miami Gardens	FL	-80.217	25.924
M12649	MMI Meats LLC.	Newport News	VA	-76.431	36.986
M12650	Fieldale Farms Corporation	Gainesville	GA	-83.799	34.286
M127	True World Foods NY LLC	Elizabeth	NJ	-74.192	40.656
M1275	Pies & Sides	Mount Holly	NC	-81.039	35.291
M129	Sorbello Refrigerated Services	Vineland	NJ	-74.991	39.508
M1290	SOPAKCO Packaging	Bennettsville	SC	-79.683	34.612
M1297	Vanee Foods Company	Berkeley	IL	-87.904	41.893
M1300	OSI Industries, LLC	Fort Atkinson	WI	-88.853	42.914
M13016	City Meat Steak Co., Inc.	Houston	TX	-95.336	29.752
M13025	Quality Pork International Inc.	Omaha	NE	-96.077	41.22
M13040	Zummo Meat Co.	Beaumont	TX	-94.133	30.051
M1305	Holly Poultry, LLC	Baltimore	MD	-76.642	39.268
M13051	P.E. & F Inc. DBA DiMare's Specialty Foods	St Louis	MO	-90.286	38.613
M13054	H & B Packing Co. Inc.	Waco	TX	-97.113	31.568
M13054B	Farmer Jones Factory	Waco	TX	-97.142	31.542
M1305A	Holly Poultry, Inc.	Hanover	MD	-76.718	39.17
M13069	Benny's Pork Skins	El Paso	TX	-106.351	31.717
M13079	Rabe's Quality Meat Inc.	Omaha	NE	-96.119	41.203
M13081	Tri State Meats LLC DBA Special D Meats	Macon	MO	-92.467	39.767
M13083	Amigo's Mexican Foods, Inc	Deming	NM	-107.745	32.26
M13096	Magic Seasoning Blends, Inc.	Palmetto	LA	-91.881	30.717
M13097	Del Vecchio Foods, Inc.	Houston	TX	-95.55	29.71
M1311	JBS Souderton, Inc.	Souderton	PA	-75.341	40.294
M13125	Reser's Fine Foods, Inc.	Topeka	KS	-95.636	39.037
M13126	Dominion Foods Group LLC	Bryan	TX	-96.342	30.673
M13127	Ditta Meat Company	Pasadena	TX	-94.991	29.6
M13128B	Diversified Foods & Seasonings, L.L.C.	Madisonville	LA	-90.187	30.462
M13130	Blount Fine Foods Corp.	McKinney	TX	-96.627	33.227
M13136	Padrino Foods LLC	Irving	TX	-96.99	32.821
M13149	Krehbiels Specialty Meats Inc	McPherson	KS	-97.624	38.409
M1315	Tuff Stuff Jerky Company	Browns Valley	CA	-121.345	39.323
M13153	Fredericksburg Lockers, Inc.	Fredericksburg	TX	-98.871	30.268
M13160	Thibodeaux's Cajun Food, Inc.	Opelousas	LA	-92.119	30.5
M13170	Oklahoma City Meat Company	Oklahoma City	OK	-97.532	35.464
M13172	Intermex Products USA, LTD.	Grand Prairie	TX	-97.043	32.789
M13174A	Amy Food Inc.	Houston	TX	-95.239	29.671
M13177A	M&R Creole Enterprise Inc	Lafayette	LA	-92.027	30.259
M13180	Mrs Wheats Fabulous Foods, Inc	New Orleans	LA	-90.051	29.988
M13181	Wald Family Foods	Omaha	NE	-96.123	41.222
M13181A	Wald Family Foods, LLC	McPherson	KS	-97.683	38.357
M13186	JYC Enterprise, Inc.	Houston	TX	-95.212	29.77
M13186A	JYC Foods	Houston	TX	-95.531	29.723
M13189	Union Slaughter House, Inc.	Del Rio	TX	-100.877	29.357
M1319	Chef's Fresh Foods	Mendota	CA	-120.385	36.762
M13199	Chorizo de San Manuel Inc.	Edinburg	TX	-98.121	26.559
M13201	Siegi's Sausage House, Inc.	Tulsa	OK	-95.904	36.045
M13203	Boutte's Boudin	Lumberton	TX	-94.233	30.284
M13205A	Nuevo Garcia Foods, LLC	San Antonio	TX	-98.524	29.512
M13206	Rutledge Meat Processing	Rutledge	MO	-92.088	40.314
M1321	Porkie Co. Of Wis., Inc.	Cudahy	WI	-87.871	42.959
M13211	Double D Meat Co, Inc	Bogalusa	LA	-89.873	30.693
M13219	VAN Oriental Food, Inc.	Dallas	TX	-96.865	32.805
M13244	Crescent City Meats	Metairie	LA	-90.214	29.975
M13246	D. J.'s Boudain, LLC	Beaumont	TX	-94.134	30.04
M1325	Avanti Foods	Walnut	IL	-89.592	41.558
M13251	Big Easy Foods of Louisiana, LLC	Lake Charles	LA	-93.217	30.187
M1327	Peach State Kitchen	Stonecrest	GA	-84.118	33.721
M13274	Big A Meatball Company	Oklahoma City	OK	-97.563	35.479
M13276	Bottomland Prime, LLC	Amarillo	TX	-101.91	35.073
M13289	Cargill Meat Solutions	Springdale	AR	-94.122	36.204
M1329	D&S Quality Beef, LLC	Albertville	AL	-86.057	34.378
M1330	Leidy's, LLC	Harleysville	PA	-75.382	40.275
M13313	Weiyee Foods Co., Inc.	Garland	TX	-96.687	32.896
M13324	K & C Meat Processing	Navasota	TX	-96.077	30.375
M13331	Tyson Processing Services, Inc	Omaha	NE	-96.116	41.203
M13335	Walker's Food Products Co.	North Kansas City	MO	-94.575	39.131
M13343	Old Santa Fe Trail, Inc.	Albuquerque	NM	-106.564	35.075
M13346	Savoie's Sausage & Food Products, Inc	Opelousas	LA	-92.0	30.534
M1336	Snak-King LLC	City of Industry	CA	-117.95	34.012
M13367	Tan Dinh Food Products Corp.	Houston	TX	-95.391	29.912
M13375	A La Carte Foods Properties, LLC	Belle Rose	LA	-91.039	30.0
M13377	Selecto Pork Skin Company	Houston	TX	-95.296	29.737
M13387	The Original Zwolle Tamale	Zwolle	LA	-93.642	31.632
M1339	Little Man Jerky	Letona	AR	-91.827	35.361
M13409	O'Steen Meat Specialties, Inc.	Oklahoma City	OK	-97.513	35.491
M1341	Crave Creations LLC	Clearwater	FL	-82.701	27.897
M13415	Fremont Beef Company	Fremont	NE	-96.489	41.42
M13418	Kerry Inc	Fort Worth	TX	-97.312	32.64
M1342	Hartley Cold Services LLC	Hartley	IA	-95.476	43.179
M13421	S & S Foods, Inc.	Mustang	OK	-97.699	35.39
M1343	Tata's Pierogi Factory, LLC	Franklin Park	IL	-87.855	41.933
M13430	Mountain View Meats Company, Inc.	Stilwell	OK	-94.724	35.798
M13432A	Martin Foods, L.P.	Houston	TX	-95.379	29.776
M13433	Tyson Prepared Foods, Inc.	Dallas	TX	-96.887	32.684
M13437	GOA Sausage	Mesquite	TX	-96.667	32.807
M13445	Huse's Processing Inc.	Malone	TX	-96.924	31.931
M13453	Hudson Meat Market	Austin	TX	-97.751	30.246
M13456	Tyson Foods, Inc.	Pine Bluff	AR	-92.076	34.264
M13465	Empirical Foods, Inc.	Holcomb	KS	-101.051	38.003
M13467	Sausage Warehouse, LLC	Pittsburg	TX	-94.968	32.995
M13471	Kenrick's Meat Co.	St. Louis	MO	-90.295	38.549
M1348	Bare Naked Birdies, Inc.	Sacramento	CA	-121.506	38.566
M13484	Direct Source Meats	San Antonio	TX	-98.408	29.44
M13484A	Direct Source Meats - Cooked	San Antonio	TX	-98.407	29.439
M13486	Tippins Food Plant	Kansas City	KS	-94.695	39.094
M13487A	Chef John Folse and Company	Donaldsonville	LA	-90.962	30.078
M13492	Lovera Gro., Inc.	Krebs	OK	-95.723	34.926
M1350	Variety Meat Company	Chicago	IL	-87.653	41.885
M13517	Southern Wild Game Holdings LLC	Devine	TX	-98.905	29.096
M13520	Reser's Fine Foods	Topeka	KS	-95.633	39.036
M13525	Poche's	Breaux Bridge	LA	-91.904	30.313
M13530	Tian Tian Food Service	Houston	TX	-95.267	29.712
M13533	RCG Foods of Texas, Inc.	El Paso	TX	-106.465	31.772
M13551	Chappell Hill Sausage Company	Chappell Hill	TX	-96.199	30.13
M13553	WARABEYA North America, Inc.	Lewisville	TX	-96.982	33.026
M13556	Tyson Foods, Inc.	Sedalia	MO	-93.32	38.748
M13561	165368 C. Corporation	Houston	TX	-95.472	29.839
M13562	Schnuck Markets, Inc. SLNP	St. Louis	MO	-90.331	38.739
M13564	Rath, Inc.	Apache	OK	-98.355	34.899
M13575	Ridgeway Freezer Inc	Ridgeway	MO	-94.006	40.383
M13590	Southwest Processor, Inc.	Stafford	TX	-95.579	29.634
M13597	Seaboard Foods, LLC	Guymon	OK	-101.449	36.718
M13598	Lionshare LLC	Houston	TX	-95.348	29.752
M136	Hanover Foods Corporation	Hanover	PA	-76.947	39.809
M1361	VPP Group, LLC	Norwalk	WI	-90.608	43.823
M1367	Rail 19	Brashear	TX	-95.7	33.012
M1377	Sky Ranch Meat LLC	Jessup	MD	-76.801	39.148
M1380	Suzanna's Kitchen	Suwanee	GA	-84.03	34.034
M1382	Suzanna's Kitchen Inc	Norcross	GA	-84.17	33.98
M1383	Praters Foods	Lubbock	TX	-101.867	33.493
M1384	Ritter Foods, LLC	Philadelphia	PA	-75.153	39.905
M1392	Dudley Poultry Company	Middlesex	NY	-77.265	42.718
M1393	Les Chateaux DeFrance Inc	Inwood	NY	-73.754	40.614
M1394	OFD Foods LLC	Albany	OR	-123.111	44.614
M1396	Mitty's LLC	Bloomfield	CT	-72.708	41.812
M1397	Beach Brand Foods, LLC	Salem	NH	-71.256	42.78
M140	Conagra Brands, Inc.	Archbold	OH	-84.318	41.52
M1400	American Butchery	Santo	TX	-98.109	32.62
M1403	Otto's Meats, LLC	Luxemburg	WI	-87.702	44.53
M1407	East Texas Beef Processors	Frankston	TX	-95.554	32.062
M1411	Fort Worth Meat Packers LLC	Arlington	TX	-97.052	32.756
M1417	The Hillshire Brands Company	San Lorenzo	CA	-122.153	37.669
M1425	Rudolph Foods Company	Lawrenceville	GA	-83.96	33.996
M1429	Plains Meat Co. LTD	Lubbock	TX	-101.844	33.588
M1430	Espostos Fine Foods, Inc.	South San Francisco	CA	-122.406	37.636
M1434	Clydes Sausage, Inc.	Denver	CO	-104.999	39.768
M1437	Canino's Sausage Company Co., Inc.	Denver	CO	-104.999	39.777
M1438	Sierra Meat and Seafood	Reno	NV	-119.752	39.505
M1451	Triple S Provisions	Baltimore	MD	-76.702	39.353
M1464	Taste Right Foods LLC	Rockport	IN	-87.05	37.893
M1484	Henry Kaminski, Inc.	Chicago	IL	-87.646	41.826
M1487	Palermo Villa, Inc.	Milwaukee	WI	-87.957	43.027
M1489	Tyson Refrigerated Processed Meats, Inc.	Houston	TX	-95.279	29.784
M1494	West G Street LLC	Wilmington	CA	-118.264	33.778
M1498	Phillips Brothers Country Hams, Inc.	Asheboro	NC	-79.816	35.686
M1499	Pelkins Smokey Meat Market	Crivitz	WI	-87.996	45.218
M1501	JRC Meats	Oroville	WA	-119.392	48.844
M1502	KC Farms Meats, LLC	Ferrum	VA	-80.074	36.905
M1503	C4 Enterprises, Inc.	Tierra Amarilla	NM	-106.55	36.702
M1505	The Meat Block LLC	Greenville	WI	-88.548	44.305
M1509A	Atlantic Veal & Lamb Inc	Brooklyn	NY	-73.935	40.714
M151	John W. Williams, Inc.	Bronx	NY	-73.872	40.807
M1515B	King's Command Foods (2022), LLC	Versailles	OH	-84.485	40.23
M1516	Morgan's Meat Market	Mattoon	IL	-88.371	39.489
M1523	Kronos Foods Corp.	Glendale Heights	IL	-88.098	41.934
M1524	Mrs. Ressler's Food Products Co.	Philadelphia	PA	-75.103	40.035
M1527	Omaha Variety Meats, LLC	Henderson	NE	-97.808	40.79
M1533	Nestle Culinary Innovation Center	Solon	OH	-81.465	41.402
M1534	L & L Packing Company	Chicago	IL	-87.64	41.82
M1535	Knauss Foods	Quakertown	PA	-75.325	40.44
M1540	DeBragga & Spitler, Inc.	Jersey City	NJ	-74.06	40.72
M1542	Isernio's Sausage Co.	Kent	WA	-122.231	47.398
M1543	Corfini Gourmet	Tualatin	OR	-122.791	45.376
M1544	J & M Meat Co.	Oakland	CA	-122.276	37.802
M155	Smart Foods LLC	Cincinnati	OH	-84.459	39.262
M15503	Hemphill Souse & Sausage Inc	Jackson	MS	-90.231	32.332
M15504	Snowdens LLC	Andalusia	AL	-86.507	31.324
M1554	Henningsen Foods, Inc	Norfolk	NE	-97.41	42.037
M1557	MacDonald Meat Company, Inc.	Seattle	WA	-122.322	47.579
M1562	The Center Cut Slaughter and Meat Processing	Farmington	MO	-90.458	37.824
M1566	Juanita's Foods	Wilmington	CA	-118.256	33.779
M157	Sailer's Food Market and Meat Processing	Elmwood	WI	-92.153	44.78
M15700	Fresh Mark, Salem	Salem	OH	-80.847	40.884
M15702	Malone's Fine Sausage, Inc.	Milwaukee	WI	-87.915	43.053
M15707	Champion Pizza	Hebron	IL	-88.432	42.471
M15714	Morton Pizza Partners LLC	Morton	IL	-89.489	40.603
M15720	Winkler Meats, Inc.	Peoria	IL	-89.619	40.67
M15731A	Square One Foods Inc.	Siren	WI	-92.396	45.783
M15735	FULTON MARKET	Chicago	IL	-87.737	41.815
M15738	Sunrise Foods, Inc.	Columbus	OH	-82.939	39.927
M15747	Liguria Foods, Inc.	Humboldt	IA	-94.23	42.738
M1575	Ventura Foods LLC	Albert Lea	MN	-93.351	43.624
M15754	Husnik Meat Co., Inc.	South Saint Paul	MN	-93.033	44.888
M15754A	Husnik Meat Co. Inc.	Newport	MN	-93.008	44.88
M15767	Consumers Packing Co.	Melrose Park	IL	-87.869	41.899
M15768	Miltona Custom Meats Inc.	Miltona	MN	-95.286	46.045
M15772	Sensient Flavors LLC	Harbor Beach	MI	-82.648	43.845
M157A	Sailer's Food and Meat Processing	Wilson	WI	-92.199	44.923
M1580	Kim's Processing Plant Inc	Clarksdale	MS	-90.571	34.202
M15802	Hiawatha Pasties	Naubinway	MI	-85.449	46.095
M15805	J&B Wholesale Distributing Inc.	St Michael	MN	-93.62	45.215
M15811	Oscar's Foods	Chicago	IL	-87.78	41.938
M15815	Miracapo Pizza Company LLC	Elk Grove Village	IL	-87.945	41.998
M15815A	Miracapo Pizza Company LLC	Gurnee	IL	-87.898	42.387
M15815B	Miracapo Pizza Company LLC	Elk Grove Village	IL	-87.948	41.998
M15816	Heggies Pizza, LLC	Milaca	MN	-93.645	45.767
M15818A	Kraft Heinz Foods Company	Cedar Rapids	IA	-91.635	41.932
M15825	AFS Classico, LLC	Rock Island	IL	-90.591	41.478
M15826	Keystone Meats Inc.	Lima	OH	-84.038	40.732
M15833	Premium Meats, Inc.	Warren	OH	-80.806	41.238
M15835	Dan's Prize, Inc.	Long Prairie	MN	-94.863	45.961
M15835A	Dan's Prize, Inc.	Browerville	MN	-94.864	46.069
M1584	Tai Hay Farm LLC	Lajas	PR	-67.059	18.043
M15841	DiRusso's Sausage Incorporated	Youngstown	OH	-80.668	41.109
M15845	Stiglmeier Sausage Co., Inc.	Wheeling	IL	-87.913	42.127
M15851	Contract Comestibles LLC	East Troy	WI	-88.409	42.789
M1586	TMB East LLC	Kaukauna	WI	-88.284	44.244
M1587	Gev's Kitchen	Van Nuys	CA	-118.449	34.204
M15875	The Honey Baked Ham Company, LLC	Holland	OH	-83.688	41.619
M15877	Bernatello's Pizza Inc.	Waupaca	WI	-89.244	44.33
M15878	Smithfield Packaged Meats Corp.	Sioux City	IA	-96.382	42.484
M15893	AmeriQual Group, LLC	Evansville	IN	-87.552	38.143
M15893C	Arc Industries	Evansville	IN	-87.481	38.0
M15893D	AmeriQual Distribution Center	Evansville	IN	-87.527	38.026
M15894	Winesburg Meat Inc.	Winesburg	OH	-81.698	40.615
M15896	Abbyland Pork Pack, Inc.	Curtiss	WI	-90.435	44.95
M15899	Hearthside Food Solutions, LLC	Lakeville	MN	-93.222	44.633
M1591	Mudpond Farm	Dalton	PA	-75.675	41.613
M1593	Echo Lake Foods	Huntington	IN	-85.497	40.88
M1594	Down the Road Butchery, LLC	Milan	NY	-73.804	41.981
M160	One Sixty Processing	shawnee	OK	-96.894	35.407
M1600	Sanderson Farms Foods, LLC	Flowood	MS	-90.104	32.321
M1604	Pig Rock Sausages, LLC	Boston	MA	-71.066	42.329
M161	Brakebush Brothers, Inc.	Westfield	WI	-89.487	43.818
M1610	Papa Charlie's	Chicago	IL	-87.735	41.857
M1614	Corfu Foods, Inc	Bensenville	IL	-87.945	41.978
M161W	Brakebush Brothers, Inc.	Wells	MN	-93.723	43.747
M1620	Quality Pork Processors, Inc.	Austin	MN	-92.967	43.674
M1623A	Ajinomoto Foods North America, Inc.	Carthage	MO	-94.315	37.101
M1626	Anderson Boneless Beef	Denver	CO	-104.957	39.824
M1627A	West Lake Food Corporation	Santa Ana	CA	-117.902	33.747
M1627B	Craftory	Houston	TX	-95.364	29.969
M1633	Abbyland Foods, Inc.	Abbotsford	WI	-90.311	44.942
M1633A	Abbyland Foods, Inc.	Curtiss	WI	-90.431	44.946
M1633B	ABBYLAND FOODS	ABBOTSFORD	WI	-90.309	44.946
M1638	Kemin Proteins, LLC	Verona	MO	-93.795	36.97
M1640	Mrs. Stratton's Salads	Birmingham	AL	-86.855	33.451
M1641	Briardale Ostrich Farms	Okeechobee	FL	-80.98	27.41
M1642	The Meat House	Andover	SD	-97.888	45.414
M1645	Nathan & Sons, Inc.	South El Monte	CA	-118.035	34.048
M165	Bachoco OK Foods	Fort Smith	AR	-94.385	35.423
M1650	El Ranchito Jerky, LLC	Santa Fe	NM	-106.045	35.596
M1652	Gourmet Game Processing	Dilworth	MN	-96.706	46.877
M1653	Top Food Provision	Paterson	NJ	-74.149	40.893
M1654	United States Meat Animal Rese	Clay Center	NE	-98.133	40.524
M1655	Rashbe Holdings, Inc.	Birdsboro	PA	-75.828	40.277
M1656A	Dim Sum Factory, Inc.	Whitestone	NY	-73.813	40.789
M1657	Granite State Packing Cooperative, Ltd.	Claremont	NH	-72.372	43.372
M1661	Legacy Maker Meats, LLC	Fairmount	IN	-85.671	40.397
M1664	Kah and Company Incorporated	Wapakoneta	OH	-84.18	40.578
M1668	Ebro Foods, Inc	Chicago	IL	-87.658	41.817
M1672	Home Taste Food, Inc.	Norwood	MA	-71.203	42.184
M1673	Evans Food Group LTD	Chicago	IL	-87.646	41.82
M1675	Oxford Packing LLC	Downey	ID	-112.15	42.431
M1680	IJean Food	South El Monte	CA	-118.033	34.044
M1682A	Nestle USA. INC.	Schamburg	IL	-88.063	42.073
M1684	Jenniges Meat Processing Inc	Brooten	MN	-95.132	45.502
M1686	Wiley Processing, LLC	Wiley	CO	-102.652	38.216
M1687	Symba & Snap Gourmet Food, Inc.	Cleveland	OH	-81.651	41.497
M1689	A to Z Portion Control Meats, Inc.	Bluffton	OH	-83.89	40.895
M1691	Skyline Chili LLC	Fairfield	OH	-84.483	39.328
M1692	TurnRoad LLC	Chattanooga	TN	-85.282	35.134
M1693	Charcuteria Scorpion LLC	Hialeah	FL	-80.347	25.897
M1696	Papineau Locker	Papineau	IL	-87.719	40.97
M1697	Edgewood Locker Inc.	Edgewood	IA	-91.41	42.645
M1698	Schreiber Processing Corporation	Maspeth	NY	-73.909	40.725
M170	Bridgford Food Processing Corporation	Chicago	IL	-87.661	41.813
M1701	Lakeside Foods, Inc.	Plainview	MN	-92.181	44.163
M1702	ZK Ranches LLC	Orlinda	TN	-86.661	36.609
M17050	Russ' Commissary	Holland	MI	-86.097	42.831
M1706	Distinctive Foods, LLC	Bensenville	IL	-87.93	41.947
M17064	Devanco Foods	Carol Stream	IL	-88.105	41.925
M1707	Thomas Brothers Foods LLC	Asheboro	NC	-79.785	35.748
M17074	A. Gimenez Trading LLC	Oak Ridge	NJ	-74.528	41.052
M17077	458 1/2 South Broadway Meat Inc	Yonkers	NY	-73.896	40.918
M1708	Creation Gardens, Inc.	Austell	GA	-84.583	33.762
M17081	Newport Meat of Nevada	Las Vegas	NV	-115.189	36.091
M17086	Frontiere Natural Meats, LLC	Denver	CO	-104.976	39.788
M17095	Boesl Packing Co., Inc.	Baltimore	MD	-76.579	39.318
M171	Moweaqua Packing Plant	Moweaqua	IL	-89.019	39.631
M1710	EmpaNet LLC	Tampa	FL	-82.464	28.025
M17104	Hermanos Dajer Inc.	Irvington	NJ	-74.245	40.72
M1712	Florida First Meats Co., LLC	Frostproof	FL	-81.571	27.668
M17124	California Correctional Training and Rehabilitation Authority (CALCTRA)	Ione	CA	-120.948	38.375
M17135	Claymont Food Co.	Claymont	DE	-75.457	39.802
M1714	Jensen Reserve	Loganville	GA	-83.818	33.869
M17143	JWM Distribution	San Bernardino	CA	-117.26	34.106
M17151	UW Provision Company, Inc.	Middleton	WI	-89.535	43.101
M17155	Taylor's Mexican Chili Co. Inc	Carlinville	IL	-89.883	39.279
M17156	Ghiringhelli Brothers	Vallejo	CA	-122.241	38.097
M17161	Woolery Enterprises Inc.	San Leandro	CA	-122.173	37.704
M1720	Medicine Lodge Meat Company LLC	Medicine Lodge	KS	-98.589	37.284
M17202A	Americold Logistics, LLC	Sioux City	IA	-96.371	42.427
M17202B	Americold Logistics, LLC	Napoleon	OH	-84.1	41.412
M17202S	Americold Logistics LLC	Sanford	NC	-79.214	35.518
M1721	Redondo's LLC	Waipahu	HI	-158.018	21.377
M17217A	Plymouth Poultry Co.	Auburn	WA	-122.231	47.338
M1722	Overhill Farms, Inc.	Vernon	CA	-118.214	34.004
M17220	Geier's Sausage Kitchen	Sarasota	FL	-82.538	27.419
M17237	K. T.'s Kitchens, Inc.	Carson	CA	-118.256	33.876
M17250	Tyson Foods, Inc.	Blountsville	AL	-86.584	34.058
M17256	Garden Fresh Foods, LLC	Milwaukee	WI	-87.926	43.024
M1726	Tomoe Food Services, Inc.	Bronx	NY	-73.872	40.807
M17260	International Provisions, Inc.	Hamden	CT	-72.932	41.341
M17260A	International Provisions, Inc.	Hamden	CT	-72.931	41.342
M17260B	International Provisions, Inc.	Hamden	CT	-72.932	41.342
M17264	Hearn Kirkwood / Food Unlimited	Jessup	MD	-76.765	39.166
M17270	Sovereign Seafoods Inc	Santa Barbara	CA	-119.692	34.415
M1728	Daniel Jackson Meat Processing	Ranburne	AL	-85.349	33.557
M17280	JBS Prepared Foods - Swanton Facility	Swanton	VT	-73.128	44.928
M17281	Yoder Meats, Inc.	Shipshewana	IN	-85.58	41.672
M17284	Protenergy Natural Foods, Inc.	Cambridge	MD	-76.064	38.551
M17285	L. O. Bishop BBQ	Cherokee	AL	-88.109	34.663
M1729	OH Grate!	Collierville	TN	-89.73	35.052
M17304	Island Grown Foods, Inc.	Waipahu	HI	-158.001	21.425
M17307	Logan Food Company Inc.	Alexandria	VA	-77.107	38.807
M17309	Day-Lee Foods Inc.	Santa Fe Springs	CA	-118.054	33.892
M17311	Harry's Frozen Food	Elrosa	MN	-94.949	45.562
M17318	Jane's Stromboli	Stoneboro	PA	-80.105	41.339
M1732	Lucchesi Worldwide LLC	Memphis	TN	-89.858	35.171
M1733	UP Products, LLC	Ewen	MI	-89.289	46.532
M17335	Intra Coastal Packing, Inc.	Lake Worth	FL	-80.113	26.63
M17338	E-HWA Food Products Co.	Huntington Park	CA	-118.224	33.994
M17339	Marketplace Deli Products Inc.	Glendale	AZ	-112.175	33.52
M17341	Keystone Foods LLC	Gadsden	AL	-86.073	33.965
M17344	Macs Meats LLC	Ottawa	IL	-88.847	41.357
M17354	Central Storage & Warehouse Co	Madison	WI	-89.309	43.083
M17356	Y. H. Foods, Inc.	Skokie	IL	-87.775	42.02
M1737	DeKalb County Packing Co.,Inc	De Kalb	IL	-88.713	41.923
M17375	E.G. Food Inc.	Brooklyn	NY	-74.022	40.647
M1738	Monogram Gourmet Foods	Haverhill	MA	-71.124	42.787
M17384	Sconnie Slices LLC	Glen Flora	WI	-90.894	45.498
M1739	W & G Marketing	Jewell	IA	-93.65	42.31
M17390	Shoals Provision	Florence	AL	-87.655	34.866
M17395	50th State Poultry	Pearl City	HI	-157.956	21.392
M17399	Graciana LLC	Sylmar	CA	-118.402	34.282
M1740	Brookwood Farms	Siler City	NC	-79.448	35.72
M17410	Deutschland Foods, Inc.	Lindstrom	MN	-92.847	45.39
M17413	Ossian Packing Co. Inc.	Ossian	IN	-85.166	40.873
M17417	Ajinomoto Foods North America, Inc,	San Diego	CA	-116.962	32.553
M17419	Dewig Bros. Packing Co.	Haubstadt	IN	-87.573	38.209
M17426	Great Kitchens Food Company	Brockton	MA	-71.022	42.108
M17428	Cascioppo Meats	Kirkland	WA	-122.158	47.713
M17433	Country Meats, LLC	Ocala	FL	-82.215	29.185
M17439	American Kitchen Delights Inc.	Harvey	IL	-87.67	41.611
M17445	The Quay Corporation	Lincolnwood	IL	-87.717	42.01
M1745	Maple Brook Packing	New Milford	CT	-73.421	41.592
M17453	Silver Comet Foods, LLC (FKA Tip Top Poultry Inc.) distributed by Tip Top	Rockmart	GA	-85.063	34.012
M17454	Clark's Poultry and Seafood	Hamburg	NY	-78.839	42.723
M1746	Archway Farm, LLC	Keene	NH	-72.338	42.936
M1747	Hawkeye Smokehouse Partners LLC	Burlington	IA	-91.15	40.802
M17479	Fair Oaks Foods, LLC	Pleasant Prairie	WI	-87.899	42.535
M17479T	Fair Oaks Foods, LLC	Pleasant Prairie	WI	-87.915	42.527
M1748	Stagecoach Meat Company, LLC	Wiggins	CO	-104.079	40.23
M17480	Ramar International Corporation	Pittsburg	CA	-121.887	38.014
M17480A	Ramar International Corporation	Pittsburg	CA	-121.885	38.025
M17485	Greater American Ribs Inc.	Woodbury	MN	-92.974	44.924
M1749	Coastal Plains Meat Company	Eunice	LA	-92.44	30.485
M17496	Tri Eagle Provisions, Inc.	Tippecanoe	IN	-86.115	41.172
M17505	Triland Foods, Inc.	Sergeant Bluff	IA	-96.361	42.408
M1752	Idaho Meat and Seafood	Nampa	ID	-116.564	43.578
M17521	Cheney OFS, Inc.	Orlando	FL	-81.426	28.577
M17523	Ruiz Food Products, Inc.	Dinuba	CA	-119.398	36.54
M17523A	Ruiz Food Products, Inc.	Denison	TX	-96.571	33.774
M17524	Espi's Sausage and Tocino Co.	Seattle	WA	-122.339	47.575
M17526	La Favorita Food Processing	Henderson	CO	-104.904	39.866
M17530	3 Little Pigs LLC	Wilkes Barre	PA	-75.901	41.236
M1754	Fratelli Beretta USA Inc	Mount Olive	NJ	-74.728	40.906
M17545	John's Market	Elgin	IL	-88.283	42.036
M17554	Farmingdale Meat Market, Inc., DBA Main Street Wholesale Meats	Farmingdale	NY	-73.446	40.734
M17557	JPI Wholesalers, Inc.	Hannibal	MO	-91.408	39.68
M17559	Young & Stout, Inc.	Bridgeport	WV	-80.28	39.237
M1756	Kettle Cuisine	Savage	MD	-76.806	39.132
M17564	Indiana Packers Corporation	Delphi	IN	-86.652	40.565
M17564F	Indiana Packers Corporation	Frankfort	IN	-86.5	40.284
M1757	MI Halal Meats Corp	Wayne	MI	-83.416	42.271
M17573	Bell Tasty Foods Inc	Elk Grove	CA	-121.36	38.384
M1758	Johnsonville, LLC	Sheboygan Falls	WI	-87.91	43.798
M17582	A. S. K. Foods Inc.	Palmyra	PA	-76.609	40.303
M1759	Fortune Wisconsin LLC	Green Bay	WI	-88.084	44.53
M1760	Beef Queen Corp	Opa-Locka	FL	-80.269	25.892
M17604	Americold Logistics	Montgomery	AL	-86.362	32.315
M1762	Pasta Il Cuoco Inc	Miami	FL	-80.253	25.772
M17620	Premiere Brand Meats	Shasta Lake	CA	-122.385	40.658
M17626B	Crystal Distribution Services, Inc.	Waterloo	IA	-92.322	42.491
M1763	Harv's Butcher Shop	Lancaster	KY	-84.608	37.582
M17634	M.G. Waldbaum Company	Gaylord	MN	-94.197	44.557
M17635	Emerson Distributing	Medford	OR	-122.895	42.314
M17642	Quality Snack Foods, Inc.	Alsip	IL	-87.715	41.656
M17643	Cuisine Solutions Inc.	ALEXANDRIA	VA	-77.108	38.807
M17644	Request Foods Inc.	Holland	MI	-86.102	42.832
M17644A	Request Foods Inc.	Holland	MI	-86.1	42.835
M17644B	Request Foods Inc.	Holland	MI	-86.104	42.839
M17658	Arch Foods, Inc.	Union	NJ	-74.302	40.693
M1766	Henry J's Meat Specialties	Chicago	IL	-87.739	41.917
M17669	Kerry Stock & Broth Company Inc.	Harrisonburg	VA	-78.861	38.474
M1767	Golden Meat Co., LLC	Bronx	NY	-73.872	40.807
M17681	Howard & Son Meatpacking	Mercer	PA	-80.259	41.226
M1769	Temptee Brand Steak, Inc.	Denver	CO	-104.964	39.804
M17694	Drakes Fresh Pasta Company	High Point	NC	-80.034	35.924
M17696	Mt. Airy Meat Center, Inc.	Mt. Airy	NC	-80.584	36.48
M1770	MTXBeef, LLC	Mason	TX	-99.3	30.766
M17704	Rick's Barbecue, Inc	Leoma	TN	-87.337	35.189
M17708	Logistic Services, LLC	Eldridge	IA	-90.577	41.629
M17719	Highland Packing Company, Inc.	Colona	IL	-90.357	41.471
M17728	Tyson Foods, Inc.	Vicksburg	MS	-90.66	32.366
M1773	Kettle River Products	Askov	MN	-92.781	46.191
M17749	Bastan Corporation	Chula Vista	CA	-117.085	32.596
M1775	Smithfield Packaged Meats Corp.	Des Moines	IA	-93.587	41.581
M17751	Chamblee Meats & Suppy, Inc.	Chamblee	GA	-84.292	33.896
M1776	San Lorenzo Foods, LLC	Pomona	CA	-117.73	34.06
M17776	Trenton Halal Packing Company	Trenton	NJ	-74.746	40.211
M17778	E.N.A. Meat Packing Inc.	Paterson	NJ	-74.164	40.928
M17781	Sea Bend Meat Company	Shoreline	WA	-122.347	47.749
M17789B	RMH Foods, LLC	Morton	IL	-89.485	40.609
M1779	T. Hasegawa USA, Inc.	Cerritos	CA	-118.033	33.867
M17795	Scooters Natural Meats	Brunsville	IA	-96.268	42.811
M1780	PORTION MEAT ASSOCIATION, INC.	Providence	RI	-71.438	41.827
M17802	Winston's Sausage	Chicago	IL	-87.74	41.778
M17810	Stevens Brothers, LLC	Panama	NY	-79.499	42.017
M17814	Grand Valley Foods	Grand Junction	CO	-108.632	39.11
M1782	Ensign Meats Inc.	Inglewood	CA	-118.349	33.97
M17820	Sunset Foods	West Des Moines	IA	-93.727	41.565
M17821	Gung Ho Corp.	Bellwood	IL	-87.866	41.89
M17823	JBS Prepared Foods, Inc.	Manteca	CA	-121.261	37.799
M17839A	Baratta Brothers Inc DBA Fairway Packing Co.	Fraser	MI	-82.934	42.554
M17852	Lyons Health Labs Holdco, LLC	Quakertown	PA	-75.361	40.457
M1786	Bay Lake Farms, LLC	Groveland	FL	-81.905	28.468
M17863	I-65 BBQ, Inc.	Nashville	TN	-86.823	36.188
M17866	Alaska Sausage Company, Inc.	Anchorage	AK	-149.898	61.194
M17872	Circle Pines Sausage Haus, Inc.	Circle Pines	MN	-93.171	45.136
M17874	P&F Meat Market	LANDOVER	MD	-76.861	38.943
M17876	Greenco Industries, Inc.	Monroe	WI	-89.662	42.597
M17882	El Toro Meat Packing Inc	Miami	FL	-80.21	25.84
M17887	Carnis Meat Processing LLC	Bismarck	ND	-100.777	46.833
M17888	Francisco's Meat Company	Anaheim	CA	-117.861	33.858
M1789	Randall Bakery	Hialeah	FL	-80.288	25.848
M17891	Custom Food Solutions, LLC	Louisville	KY	-85.566	38.208
M1790	Grecian Delight Foods Inc.	Elk Grove Village	IL	-87.978	42.008
M1791	Best Chicago Meat Company, LLC	Chicago	IL	-87.743	41.916
M1792	Los Tres Cochinitos	Los Angeles	CA	-118.192	34.017
M17938	Publix Supermarkets, Inc., Deli Plant	Lakeland	FL	-82.012	28.041
M17956	Creative Culinary Specialties, Inc.	Tampa	FL	-82.542	28.014
M1796	JB, LLC	Harmon	GU	144.788	13.495
M17961	Mitchell Foods, Inc.	Baily Switch	KY	-83.922	36.767
M17965	Copper City Meats, DBA Gold Medal Packing	Rome	NY	-75.343	43.192
M17967	Los Altos Beef, Inc.	Huntington Park	CA	-118.236	33.978
M1797	Picciocchi's Pasta	Scranton	PA	-75.666	41.408
M17977	Jimbonitas LLC	Hatton	ND	-97.453	47.643
M17978	Bonavista foods Inc.	Ovid	NY	-76.831	42.681
M17980	Pilgrim's Pride Corporation	Sumter	SC	-80.366	33.863
M17982	Michael's Finer Meats, LLC	Columbus	OH	-83.114	40.005
M17990A	AVA Pork Products, Inc.	Hicksville	NY	-73.541	40.765
M17991	Nuevo Mundo Foods LLC	Corona	NY	-73.868	40.746
M17993	Lineage Logistics, LLC	Sandston	VA	-77.344	37.508
M17994	Bertolino Foods, Inc.	Peabody	MA	-70.979	42.52
M17996	Ely's Pork Products Inc.	Newtown	PA	-74.903	40.297
M17999	Boston Salads and Provisions Company Inc.	Boston	MA	-71.071	42.33
M17D	Smithfield Packaged Meats Corp.	Sioux Falls	SD	-96.72	43.562
M17S	Specialty Sausage Co. LLC	Chicago	IL	-87.739	41.878
M18002	LiDestri Foods, Inc.	Fairport	NY	-77.451	43.107
M1801	Reser's Fine Foods	Halifax	NC	-77.662	36.36
M18019	Plenus Group, Inc.	Lowell	MA	-71.28	42.628
M18022	Peter's Wholesale Meat Corporation	Springfield Gardens	NY	-73.768	40.66
M1803	Legacy Meats LLC	Sumner	IL	-87.791	38.673
M18034	Americold Logistics LLC	Chesapeake	VA	-76.371	36.78
M18035	Chair City Meats Inc.	Gardner	MA	-71.996	42.571
M1804	Cargill Kitchen Solutions, Inc.	Lake Odessa	MI	-85.136	42.793
M18043	J.A.K. Inc.	Bloomfield	NJ	-74.199	40.794
M1806	Fermentato	Las Vegas	NV	-115.154	36.001
M18073	T.C. Trading Company	Blaine	WA	-122.728	48.99
M18076	Green Bay Dressed Beef, LLC	Green Bay	WI	-88.003	44.516
M18077	Best Foods Products II	Stone Mountain	GA	-84.188	33.808
M18079	Smithfield Fresh Meats Corp.	Tar Heel	NC	-78.803	34.747
M1809	Catelli Brothers Inc.	Collingswood	NJ	-75.089	39.922
M18098	Miami Purveyors, Inc.	Miami	FL	-80.315	25.778
M1811	Sorbello Refrigerated Services	Houston	TX	-95.564	29.725
M18154	Indian Valley Meats, Inc.	Indian	AK	-149.521	60.992
M1816	West Michigan Beef Co. LLC	Hudsonville	MI	-85.857	42.872
M18162	Pinata Foods, Inc.	Cleveland	OH	-81.731	41.457
M18169	Lee's Meats & Sausage, Inc.	Tea	SD	-96.855	43.462
M18174	Lucksen Trading Co.	Arcardia	CA	-118.035	34.107
M18193	Cangialosi Specialty Sausage Company, Inc.	Greensboro	NC	-79.976	36.096
M1821	RBR Meat Co., Inc.	Vernon	CA	-118.209	33.996
M18213	Cooper Hatchery, Inc.	Van Wert	OH	-84.57	40.906
M18227	Andy's Deli & Mikolajczk	Chicago	IL	-87.727	41.887
M18229	Morris Meat Packing Company, Inc.	Morris	IL	-88.422	41.376
M1823	Dorsey Processing, LLC	Pryor	OK	-95.42	36.259
M18235	Fresh Foods of Washington LLC	Everett	WA	-122.253	47.943
M18237	Vital Foods, LLC	Abbeville	SC	-82.407	34.169
M18239	Sterigenics-Mulberry	Mulberry	FL	-81.984	27.899
M18252	Harvest Farms Solutions, Inc.	Lancaster	CA	-118.135	34.701
M1826	Jen's Breakfast Burritos LLC	Auburn	WA	-122.207	47.323
M18263	Gordo's LLC	Atlanta	GA	-84.426	33.71
M18267	Morris Meat Packing	Maywood	IL	-87.839	41.875
M18288	Montalvan's Sales	Ontario	CA	-117.617	34.033
M1829	Tennessee Brown Bag L.L.C.	Hixson	TN	-85.191	35.188
M18296A	Parks Family Meats, LLC	Warsaw	NC	-78.064	34.998
M18297	Bellisio Foods, Inc.	Jackson	OH	-82.631	39.055
M1830	Bergeron's Red Pig Group LLC	Port Allen	LA	-91.249	30.458
M18301	Asahi Foods Inc.	Los Angeles	CA	-118.207	34.017
M18315	Bush Brothers Provision Company	Royal Palm Beach	FL	-80.204	26.705
M18318	Sausage World, inc.	Stone Mountain	GA	-84.187	33.83
M1832	Helena Farm	Sumner	IL	-87.906	38.613
M1833	TCM Foods	Elmsford	NY	-73.815	41.074
M18338	Conagra Brands (Conagra Foods Packaged Foods LLC)	Troy	OH	-84.188	40.026
M18341	Crescent Prime Cuts, Ltd.	Farmingdale	NY	-73.415	40.755
M18342	Mannino's Wholesalers Corp	Hauppauge	NY	-73.246	40.809
M18349	Reggio's Pizza, Inc.	Chicago	IL	-87.634	41.744
M1835	The Country Butcher	Decatur	IN	-84.954	40.822
M18350	Traditions Prepared Meals, LLC	Pearl	MS	-90.063	32.275
M18355	CARLE'S BRATWURST, INC.	Bucyrus	OH	-82.96	40.811
M18356	Ajinomoto Foods North America	Portland	OR	-122.751	45.632
M18356B	Ajinomoto Toyo Frozen Noodle, Inc.	Portland	OR	-122.744	45.629
M18357	Monogram Foods	Plover	WI	-89.547	44.477
M18357A	Monogram Appetizers, LLC	Plover	WI	-89.495	44.457
M18364	George Frozen Foods	Linden	NJ	-74.257	40.643
M18369	Itoham America, Inc.	Sioux City	IA	-96.376	42.426
M18370	Hometown Sausage Kitchen	East Troy	WI	-88.363	42.806
M18380	Pat's Wholesale Meat & Pizza Supply	Blue Island	IL	-87.681	41.667
M18387	At Last Gourmet Foods	Minneapolis	MN	-93.241	44.959
M18388	Kayem Foods Inc.	Woburn	MA	-71.143	42.505
M18389	Orchard Sausages, Inc.	Brooklyn	NY	-73.935	40.707
M1838A	Ezzo Sausage Company	Columbus	OH	-83.14	39.966
M18398	Wang Shi Corporation	Long Island City	NY	-73.93	40.741
M1840	Dakota Butcher	Watertown	SD	-97.136	44.89
M18401	Gosar Natural Foods L.L.C.	Monte Vista	CO	-106.076	37.612
M18403	Van-Lang Enterprises, Inc.	Countryside	IL	-87.861	41.796
M18405A	New Cheung's Meat Wholesale In	Brooklyn	NY	-73.948	40.707
M1841	Sugar Creek Packing Company	Washington Court House	OH	-83.408	39.536
M18416	New York Food Service, Inc.	Bronx	NY	-73.873	40.807
M18418	Johns Genova Delicatessen, Inc.	Walnut Creek	CA	-122.08	37.898
M1841B	Sugar Creek Packing Co.	Dayton	OH	-84.255	39.763
M1841C	Sugar Creek Packing Co.	Hamilton	OH	-84.471	39.316
M1841D	Sugar Creek	Fairfield	OH	-84.481	39.327
M1841E	Sugar Creek	Cambridge City	IN	-85.152	39.842
M1841G	Sugar Creek Packing Co.	Washington Court House	OH	-83.41	39.533
M1842	ENA Meat Packing Corp.	Paterson	NJ	-74.165	40.928
M18426	Corky's Food Manufacturing, LP	Memphis	TN	-90.032	35.067
M1843	Hamakua Meat Processors LLC	Ookala	HI	-155.27	20.008
M18432	Bangkok Meatball Corp. #2	Lynwood	CA	-118.215	33.939
M18435	Lineage Logistics Services, LLC	Tar Heel	NC	-78.804	34.753
M1844	Ivy Log Meat Processing, LLC	Blairsville	GA	-84.033	34.936
M18442	Ba Le Meat Processing	Des Plaines	IL	-87.921	42.024
M18443	Stoney Point, Inc.	Littlestown	PA	-77.11	39.731
M18443A	Stoney Point, Inc.	Littlestown	PA	-77.085	39.747
M18449	WING Y Meats Inc.	Brooklyn	NY	-73.935	40.726
M18450	Gourmet Kitchen Inc	Neptune	NJ	-74.022	40.21
M18468	Kettle Cuisine Midco, LLC	Lynn	MA	-70.948	42.457
M18485	Hotpie Incorporated	Fort Pierce	FL	-80.405	27.471
M1849	Gleaners Food Bank	Indianapolis	IN	-86.261	39.711
M18498	Woodridge 31 Copacking Company LLC	Chicago	IL	-87.731	41.837
M18498A	Woodridge 31 Copacking Company LLC	Woodridge	IL	-88.014	41.697
M185	Case Pork Roll Company Inc.	Trenton	NJ	-74.739	40.21
M18502B	Missa Bay LLC	Swedesboro	NJ	-75.334	39.767
M18504	King Kold	Englewood	OH	-84.304	39.883
M18504A	King Kold, Inc.	Englewood	OH	-84.304	39.883
M18506	Pride Enterprise Food Products	Raiford	FL	-82.193	30.066
M18510	Werner Gourmet Meat Snacks Inc.	Tillamook	OR	-123.834	45.455
M18512	Dave's Salad House	Elizabeth	NJ	-74.211	40.675
M1852	Origami Catering	Portland	OR	-122.676	45.562
M18524	Steve's Meat Market, Inc.	Ellendale	MN	-93.297	43.873
M18526	Los Primos Meats Inc.	Brooklyn	NY	-73.937	40.712
M18527	Prime Meats LLC	Tucker	GA	-84.192	33.86
M18530	Envision Cold	Austin	MN	-92.956	43.685
M18532	Costco Wholesale Meat Plant	Tracy	CA	-121.531	37.721
M1854	Pierino Frozen Foods, Inc.	Lincoln Park	MI	-83.187	42.252
M18548	Li Chuen Company, Inc.	New York	NY	-73.939	40.712
M1855	Sinzenard International Foods	St. Louis	MO	-90.27	38.593
M18554	JCG Industries	Chicago	IL	-87.741	41.958
M18554A	JCG Industries	Franklin Park	IL	-87.863	41.918
M18559	Grand Food	Hayward	CA	-122.118	37.622
M18563	Crown Meat & Provisions	Palm Springs	CA	-116.495	33.814
M18567	E&M Innovative Forager, LLC	Deerfield Beach	FL	-80.127	26.307
M1857	Cypress Cold Storage, LLC	North Little Rock	AR	-92.249	34.769
M18578	Kellys Foods, Inc.	Winter Garden	FL	-81.566	28.558
M18581	Suitor Meat Co., Inc.	Rienzi	MS	-88.572	34.797
M18583	Green Meadows Foods, Inc	Paxton	IL	-88.098	40.463
M18591	Onion Crock of Michigan	Grand Rapids	MI	-85.687	42.986
M18596	K&L Ranch Inc.	Paterson	NJ	-74.188	40.924
M18600	Greco and Sons	Bartlett	IL	-88.236	41.984
M1863	D & J Custom Cutting LLC	Hartly	DE	-75.69	39.167
M18632	Very Good Meat Company	Hudson	SD	-96.454	43.132
M18636	Mad Butcher Meat Co. Inc.	Sacramento	CA	-121.391	38.509
M18639	Pede Brothers Incorporated	Schenectady	NY	-74.003	42.79
M18642	Three Paisano's Food Service Inc.	South Toms River	NJ	-74.217	39.939
M18646	Coblentz Distributing, Inc	Millersburg	OH	-81.76	40.544
M18646D	Coblentz Distributing, Inc	Millersburg	OH	-81.76	40.544
M18654B	Tipico Food Inc.	Gardena	CA	-118.303	33.902
M18654C	Baram Foods LLC	Gardena	CA	-118.304	33.902
M18657	Niagara Specialty Foods, Inc.	Kenmore	NY	-78.879	42.973
M18661	Mega Meats	Bronx	NY	-73.86	40.867
M18667	Ellsworth Foods Inc.	Tifton	GA	-83.537	31.444
M18669	Midamar Corporation	Cedar Rapids	IA	-91.685	41.919
M18673	Hermanos Santiago Cash & Carry	Ponce	PR	-66.584	18.042
M18673A	Manhattan Packing, Inc.	Ponce	PR	-66.599	18.016
M18678	Fells Point, LLC	Baltimore	MD	-76.659	39.274
M1868	Meade Locker & Processing, LLC	Meade	KS	-100.349	37.287
M1869	Kraft Heinz Company	Massillon	OH	-81.541	40.779
M18691	Landes Fresh Meats, Inc	Clayton	OH	-84.334	39.881
M1870	Bud's Custom Meats, Inc.	Penngrove	CA	-122.664	38.319
M18701	NYS DOCS, OFFICE OF NUTRITIONAL SERVICES/FOOD PRODUCTION CENTER	ROME	NY	-75.48	43.184
M18714	Lord's Meats, Inc.	Dexter	GA	-83.054	32.432
M18715	Garfield Locker	Garfield	MN	-95.486	45.934
M18718	Sausage Factory Inc.	Los Angeles	CA	-118.356	34.049
M18726	Premio Foods, Inc.	Brooksville	FL	-82.462	28.48
M18736	Seugling Meat Packing Inc.	Pequannock	NJ	-74.293	40.945
M1874	Mondo & Sons	Tukwila	WA	-122.25	47.445
M18743	Olympia Food Industries, Inc.	Franklin Park	IL	-87.864	41.924
M18746	Lindsay Foods, Inc.	Milwaukee	WI	-87.941	43.022
M1875	H&L Custom Processing	Coalgate	OK	-96.319	34.517
M18766	MABELS PLACE CORP	Hallandale Beach	FL	-80.164	25.989
M18780	R. L. Schreiber Inc.	Lebanon	KY	-85.244	37.592
M18781	Golden Krust Patties Inc.	Bronx	NY	-73.902	40.842
M18783	Pepsico Caribbean, Inc.	Barceloneta	PR	-66.554	18.426
M1879	Lloyd's Barbeque Company, LLC	St. Paul	MN	-93.171	44.866
M18797	Kitchen Fresh Foods, LLC	Green Bay	WI	-88.074	44.579
M18799	Gourmet Boutique, LLC	Jamaica	NY	-73.779	40.666
M18799A	Gourmet Boutique, LLC SAT	Jamaica	NY	-73.774	40.663
M1880	Neighbors Meats LLC	New Richland	MN	-93.496	43.893
M1882	Danielson Food Products, Inc.	Chicago	IL	-87.632	41.819
M18820	Mathew's Prime Meats, Inc.	West Babylon	NY	-73.356	40.709
M18821	Alberto's Meat Shop	Vista	CA	-117.224	33.149
M18823	Fortune Avenue Foods, Inc.	Ontario	CA	-117.587	34.035
M18823A	Fortune Avenue Foods, Inc.	Ontario	CA	-117.587	34.035
M18826A	Faribault Foods, Inc.	Faribault	MN	-93.289	44.328
M18831	Campbell Soup Supply Co., LLC	Milwaukee	WI	-87.918	42.953
M18832	M&P Production LTD	Brooklyn	NY	-73.997	40.647
M18835	Grand Banks Specialty Food, LLC	Naugatuck	CT	-73.044	41.51
M1884	Del Popolo LLC	San Francisco	CA	-122.415	37.77
M18846	McCain Foods USA, Inc.	Appleton	WI	-88.449	44.267
M1885	Colinas Products LLC	Round Rock	TX	-97.61	30.498
M18850	COQUI MEATS LLC	Bayamon	PR	-66.194	18.276
M18853A	Tamales By La Casita Inc.	Denver	CO	-105.012	39.767
M18855	Reynaldo's Mexican Food Company, LLC	Vernon	CA	-118.214	34.006
M18859	North American Bison, LLC	New Rockford	ND	-99.117	47.653
M18862	Kim Son Food Co.	San Leandro	CA	-122.184	37.719
M18866	Jennie-O Turkey Store Sales, LLC	Willmar	MN	-95.08	45.11
M18867	Macelo Central S.E. Inc.	Aibonito	PR	-66.315	18.129
M1887	Marcel's Portion Pak, Inc	Opa-Locka	FL	-80.265	25.895
M18876	OMH Cook Chill Production Center	Orangeburg	NY	-73.976	41.043
M18878	Piccinini Brothers, Inc	New York	NY	-73.992	40.76
M1888	Surlean Foods	Tolleson	AZ	-112.233	33.44
M18888	Brighton Packing LLC	Chicago	IL	-87.694	41.806
M1889	Violet Sanford Holdings, LLC	Sanford	NC	-79.23	35.525
M18894	Timberline Meats, LLC	Dundee	NY	-77.035	42.555
M18895	US Foods, Inc.	Hawthorne	CA	-118.361	33.919
M18897	Cueritos and  Botanas Coahuila	Pomona	CA	-117.752	34.092
M18898	Johnson Meat Co., Inc.	Tampa	FL	-82.449	28.032
M18901	Sugartown Smoked Specialties	West Chester	PA	-75.589	39.962
M18909	Diestel Turkey Ranch	Turlock	CA	-120.844	37.485
M18911	Mary's Ranch	Miami	FL	-80.396	25.922
M1893	LoKey Meat Co. LLC	Pulaski	TN	-86.904	35.285
M18931	New Specialty Products, Inc.	Chicago	IL	-87.661	41.808
M18935	Givaudan Flavors Corporation	Florence	KY	-84.627	38.965
M18938	T & B Food Corp.	College Point	NY	-73.839	40.784
M18939	Mingua Brothers Beef Jerky	Paris	KY	-84.285	38.212
M18943	S & S Institutional Foods	Atlanta	GA	-84.409	33.793
M18951	Prime Snax Inc.	Salt Lake City	UT	-111.907	40.732
M18957	Ralphs Ranches, Inc.	Macdoel	CA	-122.107	41.775
M1896	City Foods, Inc./Bea's Best Corned Beef	Chicago	IL	-87.656	41.817
M18960	Hardison's Carolina Barbecue, Inc.	Jamesville	NC	-76.863	35.812
M18963	Quincy Street, Inc.	Holland	MI	-86.112	42.84
M18969	Contes Pasta Co., Inc.	Vineland	NJ	-75.018	39.51
M18977	Mediterranean Foods, Inc.	Yeadon	PA	-75.259	39.936
M18987	JRG Meat Processing Plant	Aibonito	PR	-66.262	18.115
M18988	Little Town Jerky Co Inc.	Falmouth	MI	-85.086	44.243
M18988A	Ebels Family Center, Inc.	Falmouth	MI	-85.086	44.243
M18988B	Ebels Meat Processing	Falmouth	MI	-85.086	44.243
M1899	Jensen Meat Company, Inc	San Diego	CA	-116.981	32.553
M18994	The 29ers Provisions	Los Angeles	CA	-118.242	34.004
M18995	California Jerky Factory, Inc.	S. El Monte	CA	-118.044	34.052
M18995A	Bach Cuc Beef Jerky, Inc	S. El Monte	CA	-118.05	34.058
M18A	Pitman Farms	Mt. Crawford	VA	-78.935	38.377
M19	Smithfield Packaged Meats Corp.	Omaha	NE	-95.961	41.208
M190	Jennie-O Turkey Store, Inc.	Barron	WI	-91.848	45.402
M19002	Boe Farms	Moselle	MS	-89.339	31.541
M19009	LiDestri Foods Inc.	Fresno	CA	-119.663	36.728
M1901	Wall Meats Rapid	Rapid City	SD	-103.152	44.097
M19011	Ian's Corporation, DBA Hudson River Foods	Castleton	NY	-73.753	42.541
M1901A	Wall Meats Processing	Wall	SD	-102.238	44.001
M19028	KAHIKI FOODS, INC.	Gahanna	OH	-82.855	39.99
M1903	Pasou Foods, Inc.	Syracuse	IN	-85.746	41.409
M19030	Suncrest Farms Country Hams, Inc.	Wilkesboro	NC	-81.152	36.133
M19034	Berk Lombardo Packing Co.. Inc.	Hauppauge	NY	-73.225	40.811
M19056	Let's Do Lunch, Inc.	Gardena	CA	-118.279	33.885
M19062	Food Supply Inc.	Daytona Beach	FL	-80.993	29.154
M19063	Performance Foodservice	Dover	FL	-82.237	27.994
M19076	The Wornick Company	Cincinnati	OH	-84.376	39.261
M19076B	The Wornick Company dba Baxters North America, Inc.	Cincinnati	OH	-84.379	39.261
M19079	Hoskie Co. Inc.	Brooklyn	NY	-73.928	40.707
M1908	Easternview Farms LLC	Drakes Branch	VA	-78.548	36.895
M19083	O'Tasty Foods, Inc.	City of Industry	CA	-117.957	34.021
M19085	CTI Foods LLC.	Owingsville	KY	-83.772	38.127
M1909	Legacy Agricultural Farms LLC	Hempstead	TX	-95.981	30.157
M19099	Prime Food Processing, LLC	Brooklyn	NY	-73.934	40.716
M19109	Hearthside Food Solutions, LLC	Shakopee	MN	-93.453	44.786
M19113	Stampede Culinary Partners, Inc.	Bridge View	IL	-87.812	41.758
M19113A	Stampede Culinary Partners, Inc.	Oak Lawn	IL	-87.759	41.694
M19113B	Stampede Culinary Partners, Inc.	Bedford Park	IL	-87.797	41.773
M19113N	Stampede Culinary Partners, Inc.	Sunland Park	NM	-106.643	31.863
M19114	Vermont Beef Jerky Co.	Orleans	VT	-72.212	44.806
M1912	Chapel Ford Farm, LLC	Gettysburg	PA	-77.23	39.754
M19125	Greer's Tennessee Country Hams	Franklin	TN	-86.93	35.895
M1913	American Meat Companies	Pico Rivera	CA	-118.096	34.003
M19132	New Boston Meats Co., Inc.	Boston	MA	-71.067	42.329
M1913A	Three Sons Processing-Texas, Inc.	DFW Airport	TX	-97.016	32.882
M1915	Green Top Farms	Brooklyn	NY	-73.936	40.712
M19151	H.M.G. Processing LLC	Youngstown	OH	-80.639	41.117
M1916	Circle S Meats	Rutherfordton	NC	-82.083	35.452
M19160	Al Shabrawy Inc.	South River	NJ	-74.379	40.451
M19168	Lineage Logistics, LLC	Tacoma	WA	-122.402	47.246
M19177	Mucci Food Products Ltd	Canton	MI	-83.452	42.342
M1917A	J.T.M. Provisions Company	Harrison	OH	-84.808	39.251
M1918	Orange Custom Game Processing	Orange	VT	-72.39	44.143
M19185	Spectrum Preferred Meats, Inc	Mt Morris	IL	-89.458	41.989
M19188	Tuv Taam Corp	Brooklyn	NY	-73.954	40.699
M1919	Buck N' Bull Meatworx	Bowie	TX	-97.798	33.578
M19191A	San Francisco Foods, LLC	San Leandro	CA	-122.173	37.698
M19194	US Foods, Inc.	Phoenix	AZ	-112.159	33.437
M19198	Bakkavor Foods USA, Inc	Charlotte	NC	-80.95	35.133
M1920	John Hofmeister & Son, Inc	Chicago	IL	-87.675	41.849
M19208	Puerto Rico Pork Products	Moca	PR	-67.065	18.325
M19209	Pacific Coast Container, Inc.	Seattle	WA	-122.344	47.57
M1921	Nom Nom Dumplings, LLC.	New York	NY	-73.994	40.72
M19212	Shanghai Egg Rolls Co.	Beckley	WV	-81.192	37.774
M19222	Quality Meats Processors	Caguas	PR	-66.028	18.226
M19232	Bowman & Landes Turkeys, Inc.	New Carlisle	OH	-84.096	39.912
M1924	Tad-Tony Operations, LLC	Baton Rouge	LA	-91.119	30.451
M19252	The Butcher Block	Oakland	MD	-79.357	39.404
M1926	Paradox Foods LLC	Oceanside	CA	-117.27	33.214
M19263A	Pulmuone Foods USA, Inc.	Gilroy	CA	-121.548	36.986
M19263B	Pulmuone Foods USA Inc.	Mira Loma	CA	-117.521	34.027
M19268	Commercial Food Services	Salt Lake City	UT	-111.893	40.696
M1927	Jerky Boys, LLC	Spring Hill	TN	-86.884	35.742
M19278	The Butcher Shop Inc	Columbia	SC	-81.115	34.029
M1928	Palermo's Villa Inc.	Jefferson	WI	-88.814	42.99
M19290	Working H Meats, LLC	Friendsville	MD	-79.392	39.639
M19292	Bubba Foods, LLC	Elberton	GA	-82.9	34.096
M19299	Jennie O Turkey Store Sales, LLC	Montevideo	MN	-95.699	44.954
M1930	Dairyland Produce, LLC	Mattapoisett	MA	-70.813	41.677
M19300	Skyline Provisions	Harvey	IL	-87.635	41.586
M1932	R&V Products Distributors Inc.	National City	CA	-117.103	32.656
M1933	Sierra Skins Inc.	Los Angeles	CA	-118.253	34.025
M19336	Nebraska Beef Ltd.	Omaha	NE	-95.967	41.215
M19339	Vanee Foods Company	Broadview	IL	-87.861	41.854
M19340	Bromley Meats	Miami	FL	-80.191	25.944
M1936	Smithfield Packaged Meats Corp.	Kinston	NC	-77.658	35.269
M1937	Steinbach Foods LLC	Chicago	IL	-87.694	41.806
M19376	Seattle Egg Roll Corp	Auburn	WA	-122.221	47.328
M19387	Glenoaks Food, Inc.	Sun Valley	CA	-118.372	34.236
M1939	Mills County Meat Locker	Goldthwaite	TX	-98.571	31.451
M19393	AMPC LLC.	Harlan	IA	-95.305	41.645
M1940	Ruprecht Company	Mundelein	IL	-87.982	42.254
M19409	Siemer Distributing Co., Inc.	New Lexington	OH	-82.185	39.709
M1941	Sugarloaf Mountain Meats and Processing	Morehead	KY	-83.523	38.211
M1942	Premium Foods LLC	Tulsa	OK	-96.086	36.042
M19433	Ambassador Meat Distributor, Inc	Kansas City	MO	-94.547	39.12
M19435	Monogram Foods	Denison	IA	-95.364	42.009
M19439	Fiore Di Pasta, Inc.	Fresno	CA	-119.739	36.706
M19444	Nor-Am Cold Storage, Inc	Saint Joseph	MO	-94.861	39.734
M19449	Blount Fine Foods	Warren	RI	-71.285	41.727
M19449A	Blount Fine Foods	Fall River	MA	-71.106	41.743
M19451A	Apex Cold Storage Co.	Fife	WA	-122.382	47.238
M19453	Soup Bases Loaded	Ontario	CA	-117.601	34.041
M19455	Dickinson & Son 84 Packing Co., Inc.	Eighty Four	PA	-80.119	40.18
M1946	Tutta Bella Culinary	Seattle	WA	-122.325	47.567
M19472	Philly's Best Steak Company, Inc.	Yeadon	PA	-75.261	39.938
M19472A	Philly's Best Steak Co., Inc.	Yeadon	PA	-75.262	39.937
M19476	A.N. Deringer, Inc.	Sweetgrass	MT	-111.968	48.997
M19478	ABF Packing, Inc.	Dublin	TX	-98.279	32.171
M1947A	Halperns' Steak and Seafood Company LLC	Kalamazoo	MI	-85.535	42.248
M1948	Five Goods, Inc.	Long Island City	NY	-73.958	40.741
M19490	Lake Erie Frozen Foods Mfg. Co.	Ashland	OH	-82.303	40.887
M1950	Provident Meat Company	Fillmore	UT	-112.41	39.037
M19504	AdvancePierre Foods, Inc	Vineland	NJ	-75.053	39.527
M19511	Wilkes Abattoir, LLC	North Wilkesboro	NC	-81.156	36.193
M19511A	Wilkes Abattoir, LLC	N. Wilkesboro	NC	-81.136	36.162
M1952	Art Gourmet Catering Corp	Tewksbury	MA	-71.23	42.61
M19520	O. K. Food Products	Valatie	NY	-73.681	42.415
M19523	Simmons' Barbecue Inc	Guntersville	AL	-86.303	34.348
M19527	Five Star Food Products, Inc.	Bethpage	NY	-73.499	40.756
M19539	Mclane Foodservice Distribution, Inc.	Sumner	WA	-122.25	47.218
M19541	Mineola Packing Co. Inc.	Mineola	TX	-95.477	32.66
M19545A	Integrity Foods Inc.	Athens	GA	-83.345	33.982
M19549	Elkhorn Valley Packing LLC	Harper	KS	-98.026	37.297
M19549A	Elkhorn Valley Packing LLC	Wellington	KS	-97.381	37.276
M19555	US Import Meat Inspection	Sweetgrass	MT	-111.969	48.995
M19562	Country Home Processing LLC	Albion	IL	-88.032	38.381
M19566	Alex's Meat & Provisions	Brooklyn	NY	-74.022	40.647
M19566A	Mr. Pierogi	Brooklyn	NY	-73.993	40.67
M1957	Chicago Meat Authority	Chicago	IL	-87.654	41.808
M19575	Boar's Head Provisions Co., Inc.	Forrest City	AR	-90.814	34.996
M1957A	Chicago Meat Authority	Chicago	IL	-87.653	41.807
M19596	Christian Aid Ministries	Ephrata	PA	-76.106	40.142
M1960	Isabella Foods, Inc.	El Paso	TX	-106.334	31.749
M19603ERR	Nebraska Cold Storage	Hastings	NE	-98.375	40.622
M19605	Papetti's Hygrade Egg Products, Inc.	Klingerstown	PA	-76.697	40.66
M19606	Grandpapa's Inc.	Detroit	MI	-83.035	42.423
M19617	Pederson's Natural Farms, INC.	Hamilton	TX	-98.131	31.691
M1962	Perry Way Foods, LLC	Watertown	WI	-88.756	43.177
M19636	Tyson Foods Inc	Union City	TN	-89.01	36.42
M1964	Renner Corner Jerky	Renner	SD	-96.713	43.649
M19644	Vergos International Products, Inc	Memphis	TN	-90.049	35.154
M19646	Bernatello's Pizza, Inc.	Kaukauna	WI	-88.261	44.296
M1965	WRJ Meats and Custom Cuts	Blackshear	GA	-82.228	31.239
M19652	Swift Beef Company	Greeley	CO	-104.688	40.444
M19665	E-Z Shop Kitchen, Inc.	Fremont	OH	-83.102	41.35
M1968	Big Creek Farm LLC	Laurel Hill	FL	-86.482	30.988
M19682	LSG Sky Chefs	Orlando	FL	-81.317	28.442
M19690	Atlantic Coast Freezers, LLC	Vineland	NJ	-75.025	39.518
M19692	AdvancePierre Foods, Inc.	Enid	OK	-97.808	36.419
M19697	Chaudhry Meat Company, Inc.	Siler City	NC	-79.499	35.74
M1970	Chops and Steaks LLC	North Brunswick	NJ	-74.528	40.44
M1971	Wanchese Fish Company	Newport News	VA	-76.414	36.969
M19710	Golden Phoenix International Foods., Inc.	St. Louis	MO	-90.198	38.613
M19716	Hampton Meat	Decatur	TN	-84.806	35.486
M19717	Lynch BBQ Company	Decorah	IA	-91.737	43.297
M19719	Twin Rivers Foods	Fort Smith	AR	-94.427	35.391
M19719E	Twin Rivers Foods	Ft. Smith	AR	-94.426	35.394
M1972	Calumet Diversified Meats Inc.	Pleasant Prairie	WI	-87.903	42.509
M1973	Brook Meadow Fresh Farm, LLC	Harrisburg	PA	-76.89	40.285
M19734	Scimeca's Sausage Co.	Kansas City	MO	-94.562	39.104
M1974	Superior Farms - Grove Division	Blue Island	IL	-87.676	41.655
M19744	Fuji Foods, Inc.	Burlington	NC	-79.435	36.134
M1975	Raw Basics LLC	St. Francis	WI	-87.873	42.97
M19753	Wenzel's Farm, LLC	Marshfield	WI	-90.175	44.64
M19759	Lineage Logistics, LLC	Omaha	NE	-96.119	41.203
M19764	Burris Logistics	Los Angeles	CA	-118.224	34.042
M19765	Texas Chaw	Caldwell	TX	-96.715	30.529
M19776	Red Smith Foods, Inc.	Davie	FL	-80.213	26.07
M19781	Croissant Etc. Corp.	Oak Creek WI	WI	-87.914	42.914
M19782	E. Excel Food Inc	Anaheim	CA	-117.839	33.856
M19786	Prima Sausage Co Inc	Medley	FL	-80.321	25.846
M19789	4-L Processing	Como	TX	-95.433	32.92
M19790	Lineage Logistics, LLC	Norfolk	VA	-76.329	36.93
M19796	Eastside Cafe	Warrenville	IL	-88.211	41.822
M1980	AdvancePierre Foods, Inc.	Amherst	OH	-82.199	41.416
M19804	JM Packing	Ponce	PR	-66.631	18.011
M19809	Major Products	Little Ferry	NJ	-74.036	40.846
M1981	Florida Prime Snacks LLC	Hialeah	FL	-80.333	25.895
M19821	West Liberty Foods, LLC R&D Pilot Plant	West Liberty	IA	-91.256	41.567
M19825	Halal International Processing	York	SC	-81.279	35.001
M19829	Perfect Pasta, Inc.	Addison	IL	-88.017	41.928
M19829J	Perfect Pasta, Inc.	Addison	IL	-88.021	41.917
M1983	Rickman's Custom Meat Processing, LLc	Hugo	OK	-95.466	33.997
M19830	Flying Food Group	Newark	NJ	-74.196	40.698
M19834	PF Meats Company	Belton	SC	-82.491	34.523
M19836	Carolina Packers, Inc.	Smithfield	NC	-78.375	35.478
M1984	Southern Ridge Farm LLC	Columbia	TN	-87.057	35.719
M19851	Petty Brothers Meats Inc.	Annandale	MN	-94.118	45.26
M19856A	Top Taste Food, Inc.	Brooklyn	NY	-73.995	40.67
M19860	Northern Tier Bakery, LLC	Saint Paul Park	MN	-93.0	44.847
M19870	United States Cold Storage Inc	Warsaw	NC	-78.111	35.016
M19872	Empirical Foods, Inc.	So. Sioux City	NE	-96.418	42.431
M19879	Golden Valley Industries	Modesto	CA	-121.023	37.648
M1988	Thanks Danks	Austin	TX	-97.687	30.337
M19881	Bylada Foods LLC	Moonachie	NJ	-74.064	40.834
M19881A	Bylada Foods LLC	Camden	NJ	-75.12	39.925
M19884	Rosie's Snacks, Inc.	Swanton	VT	-73.092	44.886
M19887	WILD Flavors, Inc.	Erlanger	KY	-84.615	39.047
M19887A	WILD Flavors, Inc	Erlanger	KY	-84.625	39.045
M19888	Reser's Fine Foods, Inc. DBA Fresh Creative Foods	Vista	CA	-117.226	33.134
M19889	It's Jerky Inc.	Redding	CA	-122.297	40.56
M19891	ACME Jerky, LLC	Scottsmoor	FL	-80.875	28.759
M19894	Weaver Meats Inc	Painesville	OH	-81.26	41.722
M199	Hormel Foods Corporation	Austin	MN	-92.967	43.677
M1990	Del Mar Meats, Inc.	San Gabriel	CA	-118.089	34.096
M19903	Stevens Sausage Co., Inc.	Smithfield	NC	-78.317	35.463
M19904	Acre Station Meat Farm	Pinetown	NC	-76.822	35.596
M19908	Pruski's Market, Inc.	Adkins	TX	-98.288	29.371
M1991	Wonder Meats Snyder, LLC	Snyder	NE	-96.78	41.706
M19911	Lineage Logistics Services LLC	Allentown	PA	-75.6	40.567
M19915	Corfini Meat and Seafood	Salt Lake City	UT	-111.999	40.733
M19916	Salt Lake Fine Foods	Salt Lake City	UT	-111.891	40.713
M19917	Taylor Farms Illinois, Inc	Woodridge	IL	-88.014	41.699
M19918	The Pillsbury Company	Murfreesboro	TN	-86.396	35.806
M1992	Rochelle Foods, Inc.	Rochelle	IL	-89.051	41.91
M1993	Farmington Meat Co. Inc.	Forest Park	IL	-87.811	41.886
M1994	Taylor Made Meat Processing, LLC	Flintville	TN	-86.379	35.078
M19941A	Reichel Foods, Inc.	Rochester	MN	-92.466	43.968
M19941W	Reichel Foods Inc.	Rochester	MN	-92.51	44.088
M19950	Empanadas Quintero	Opa-Locka	FL	-80.232	25.904
M19953	Go Go Sales Inc.	Los Angeles	CA	-118.213	34.02
M19957	United States Cold Storage	Minooka	IL	-88.278	41.451
M19959	FCH Enterprises, Inc.	Waipahu	HI	-158.004	21.421
M1996	Freedom Sausage, Inc.	Earlville	IL	-88.847	41.537
M19964	Shepherd Foods	Springville	UT	-111.651	40.177
M1997	Hudson Valley Charcuterie, LLC	East Chatham	NY	-73.466	42.467
M19977	Packer Avenue Foods, Inc	Philadelphia	PA	-75.163	39.909
M19979	Ukrop's Homestyle Foods	North Chesterfield	VA	-77.598	37.501
M1998	Southern Texas Food Group	Eagle Pass	TX	-100.485	28.696
M1999	SFC Global Supply Chain, Inc.	Salina	KS	-97.632	38.784
M19999	AU, LAU and Associates, Inc.	Pompano Beach	FL	-80.153	26.254
M1999A	Schwan's Global Supply Chain, Inc.	Marshall	MN	-95.793	44.469
M199D	Research & Development, Hormel Foods Corporate Services, LLC	Austin	MN	-92.972	43.675
M199G	Hormel Foods Corporation	Tucker	GA	-84.251	33.839
M199O	Osceola Food, LLC	Osceola	IA	-93.787	41.024
M199P	Progressive Processing, LLC	Dubuque	IA	-90.767	42.488
M199R	Hormel Foods Group	Algona	IA	-94.223	43.079
M199V	Hormel Foods Corporation	Knoxville	IA	-93.061	41.318
M199W	Hormel Foods Corporation	Beloit	WI	-88.978	42.521
M200	America's Heartland Packing, LLC	Wright City	MO	-91.023	38.83
M2000	Hahn Bros. Inc.	Westminister	MD	-76.979	39.585
M2001	Georgelo Pizza - Chicago, Inc.	Hillside	IL	-87.913	41.882
M20023	Bakery Avenue, LLC	Claremore	OK	-95.661	36.262
M20029	Carolina Catering Corp.	Carolina	PR	-65.99	18.431
M20033	Garden Manor Farms, Inc.	Bronx	NY	-73.872	40.807
M20034	Holiday Meats of New Jersey, Inc.	Little Silver	NJ	-74.045	40.329
M20035	Bumble Bee Foods LLC	Cape May	NJ	-74.878	38.957
M20049	Don Miguel Mexican Foods, Inc.	Dallas	TX	-96.706	32.901
M2006	Manea's Meats Company	Sauk Rapids	MN	-94.166	45.591
M20069	Harvest Food Products Co., Inc.	Hayward	CA	-122.127	37.647
M20069A	Harvest Food Products Co., Inc.	Hayward	CA	-122.126	37.648
M20073	Bob's Better Beef, Inc.	South Elgin	IL	-88.302	42.005
M20076	Troy Foods Inc	Troy	IL	-89.877	38.718
M2008	Vista Meat Processing 2, LLC	Jurupa Valley	CA	-117.396	34.022
M20088	Brakebush Irving, Inc.	Irving	TX	-96.913	32.823
M20091	Country Ranch Food Products	Marietta	GA	-84.563	33.986
M20093	Fresh Gourmet Cuisine Corp	Northridge	CA	-118.557	34.232
M20103	Carnival Culinary Solutions	Jefferson	LA	-90.139	29.967
M20106	Dallas USA Foods Inc.	Dallas	TX	-96.858	32.774
M20116	BMC Cali, Inc.	Rosemead	CA	-118.083	34.063
M20117	Culinary Specialties Inc.	San Marcos	CA	-117.194	33.137
M20129	Custom Quality Packers, LLC	Sims	NC	-78.07	35.784
M20131	S & E Gourmet Cuts Inc.	San Bernardino	CA	-117.263	34.075
M2014	PERDUE FOODS, LLC.	BRIDGEWATER	VA	-78.97	38.389
M20153	Rice Field Corporation	City of Industry	CA	-117.977	34.035
M20156	Majesty Foods	Hialeah	FL	-80.339	25.895
M2016	Custom Culinary, Inc.	Oswego	IL	-88.311	41.716
M20172	American Butchers, LLC	Beaver City	NE	-99.829	40.136
M20173	Ivars Commissary	Mukilteo	WA	-122.289	47.892
M2018	The Grain Bin Butchery & Market LLC	Boyecville	WI	-91.933	45.107
M2018A	The Grain Bin Butchery & Market, LLC	Prairie Farm	WI	-91.987	45.227
M2019	Anderson & Son Meat Processing LLC	Abingdon	VA	-81.966	36.759
M20192	Northwoods Custom Meats, Inc.	Remer	MN	-93.916	47.056
M202	Pel-Freez, LLC	Rogers	AR	-94.115	36.337
M2020	Severino Pasta Mfg Co Inc	Westampton	NJ	-74.861	40.005
M20204	Denmark Sausage LLC	Peoria	AZ	-112.225	33.564
M2020A	Severino Pasta Manufacturing Company	Cherry Hill	NJ	-74.978	39.913
M2021	Penny Jo's Market	Greenville	TN	-82.825	36.158
M20215	Cajun Specialty Meats	Pensacola	FL	-87.181	30.425
M20222	JDM Specialty Foods	Elmira	NY	-76.822	42.129
M2023	Bellingar Packing	Ashley	MI	-84.572	43.136
M20232	Slovacek Foods, LP	Snook	TX	-96.478	30.493
M20239	Northwood Foods, LLC	Northwood	IA	-93.22	43.457
M2024	TP Banh Bao Distributor Inc.	San Diego	CA	-117.143	32.927
M20247	Rocky Mountain Natural Meats	Henderson	CO	-104.883	39.873
M20249	Livingston Meat Processing	Hopkinsville	KY	-87.41	36.951
M2025	Courtesy Ventures LLC	Wixom	MI	-83.515	42.509
M20251W	Tecumseh Poultry, LLC	Waverly	NE	-96.544	40.901
M20252	Mom's Wholesale Foods, Inc.	New Castle	PA	-80.35	41.011
M20254	Computer Times Publishing, Inc.	Honolulu	HI	-157.867	21.317
M20263	Halal Farms U.S.A. Inc.	Shannon	IL	-89.74	42.157
M20287	Simmons Prepared Foods, Inc.	Van Buren	AR	-94.337	35.426
M2029	Trim-Rite Food Corporation	Carpentersville	IL	-88.295	42.123
M20290	Targhee Brands, Inc.	Rexburg	ID	-111.766	43.71
M2030	Arrow Farm Meats LLC	Rock City	IL	-89.457	42.383
M20314	Nina Mia, Inc.	Fullerton	CA	-117.903	33.862
M20321	Luce's Maine Grown Meats	North Anson	ME	-69.927	44.874
M20322	Keystone Foods, LLC.	Bakerhill	AL	-85.321	31.808
M20322A	Keystone Foods, LLC	Baker Hill	AL	-85.321	31.804
M20326	Coastal Pacific Food Distributors	Stockton	CA	-121.259	37.899
M2033	Lima Family Farms, Inc	Hillsborough	NJ	-74.773	40.484
M20343	Guymon Cold Storage	Guymon	OK	-101.449	36.718
M2035	Stockyards Packing Co LLC	Oxford	OH	-84.792	39.545
M20350	EDS Wrap & Roll Foods, LLC.	Hayward	CA	-122.142	37.656
M2036	Kruse & Son, Inc.	Monrovia	CA	-118.0	34.128
M2037	Triple A Meat Sales Inc.	Bakersfield	CA	-118.965	35.354
M20373	Americold Logistics	Sebree	KY	-87.527	37.627
M20374	Quality Refrigerated Services	Omaha	NE	-95.963	41.219
M20380	Spagel Brothers Inc.	Erie	PA	-80.061	42.118
M20384	Pasta Mami	Marietta	GA	-84.543	33.926
M20401	Prime Foods, Inc.	Hyattsville	MD	-76.929	38.934
M20401A	Prime Foods	Hyattsville	MD	-76.928	38.934
M20403	American Halal Meat Inc.	Newark	NJ	-74.131	40.734
M2041	Kraft Heinz Company	Muscatine	IA	-91.042	41.438
M20411	Woodland Bison, Inc.	Memphis	IN	-85.746	38.455
M20414	Azar and Company	Jacksonville	FL	-81.647	30.331
M20420	All American Meats, Inc.	Omaha	NE	-95.967	41.215
M20422	Johnson's Smokehouse and Sausage Kitchen	East Olympia	WA	-122.832	46.966
M20425	Texas Best Beef Jerky, Inc.	Wichita Falls	TX	-98.614	33.866
M2043	Warabeya North America, Inc	Stafford	VA	-77.428	38.412
M20434	Barry's Barbeque	Fyffe	AL	-85.929	34.49
M20435	La Molisana Sausage Company LLC	Waterbury	CT	-73.049	41.541
M20441	Smithfield Fresh Meats Corp.	Salt Lake City	UT	-111.959	40.742
M20446	Central Illinois Poultry Processing LLC	Arthur	IL	-88.472	39.736
M2045	Ham Slices, LLC	Bronx	NY	-73.919	40.802
M20477	Casa Di Carfagna	Columbus	OH	-82.926	40.078
M20478	Snow Creek Meat Processing, Inc.	Seneca	SC	-83.002	34.613
M20481	Bluebonnet Foods LP	San Antonio	TX	-98.421	29.54
M20485	G&C Food Distributors, Inc.	Syracuse	NY	-76.277	43.107
M20489	Nether's Pork Skins Inc.	Sylvester	GA	-83.813	31.515
M2049	Iowa State University Meat Laboratory	Ames	IA	-93.643	42.03
M20498	Kevin's Quality Meats	Kittanning	PA	-79.522	40.82
M2051	Levoni America Corporation	Millville	NJ	-75.066	39.372
M20513	Comeaux's Inc	Breaux Bridge	LA	-91.901	30.293
M20516	Evans Meats, Inc.	Birmingham	AL	-86.797	33.524
M20518	Blue & Gold Sausage Co.	Jones	OK	-97.301	35.573
M2052	Kissin Fresh Meats Inc.	Philadelphia	PA	-75.133	39.966
M20528	Springville Meat & Cold Storage Co. Inc.	Springville	UT	-111.613	40.163
M20535	Hato Rey Meat Packing	Hato Rey	PR	-66.05	18.417
M2054	Salumificio G.B., Inc.	Milford	CT	-73.026	41.24
M20547	Mareta's Ravioli, Inc.	Leonore	IL	-88.981	41.188
M20549	Montana Valley Hams	Helena	MT	-112.02	46.705
M20552	SK Food Group	Reno	NV	-119.774	39.467
M20569	Trafon Group, Inc.	Puerto Nuevo	PR	-66.101	18.428
M20575	Rains Natural Meats	Gallatin	MO	-93.91	39.933
M20581	Atkins Sheep Ranch Inc.	Fremont	CA	-121.988	37.516
M20583	Martinez Distributors	Miami	FL	-80.317	25.802
M20594	Tooele Valley Meat	Grantsville	UT	-112.417	40.6
M2060	Country Smoke House Inc	Almont	MI	-83.058	42.97
M20600	Pasquale's Food Service Inc.	Humboldt	IA	-94.219	42.721
M20606	ConAgra Brands, Inc,	Darien	WI	-88.736	42.591
M20608	The Pork Company	Warsaw	NC	-78.123	35.007
M2062	A & M Meat Processing, LLC.	Alamogordo	NM	-105.965	32.946
M2063	Quality Meats and Seafood	West Fargo	ND	-96.902	46.884
M20634	Cucina Della Cucina, LLC.	San Fernando	CA	-118.438	34.278
M20637	Wilson Packing Company	Wilson	NC	-77.907	35.697
M20646	Glazed Honey Ham Co	Lubbock	TX	-101.89	33.52
M20647	Clarmil Manufacturing Corporation	Hayward	CA	-122.053	37.615
M2065	Picoso Foods, LLC	Albuquerque	NM	-106.59	35.129
M20650	The Pasty Oven, Inc.	Florence	WI	-88.238	45.927
M20659	Peco Foods of Mississippi	Canton	MS	-90.073	32.598
M2066	Quality Halal Processors	Harrisburg	PA	-76.882	40.283
M20668	Joseph's Gourmet Pasta	Haverhill	MA	-71.087	42.784
M20670	Steve's Meat Market	De Soto	KS	-94.964	38.975
M20672	Central Meat Processors, Inc.	Cayey	PR	-66.141	18.119
M20676	Supreme Meat Purveyors LLC	San Antonio	TX	-98.499	29.408
M20680	Sonny's 10th Avenue Meat Market Inc.	New York	NY	-73.991	40.766
M20686	Local Meats dba Harris Country Meats	Greeneville	TN	-82.893	36.176
M2071	Park Ranch Meats LLC.	Minden	NV	-119.742	38.963
M20710	Burnette Foods Inc.	East Jordan	MI	-85.122	45.152
M20717	Medina Meats, Inc/Medina Foods	Litchfield	OH	-82.038	41.184
M2072	Brookshire Brothers, Inc.	Lufkin	TX	-94.724	31.369
M20722	JBS Prepared Foods	Council Bluffs	IA	-95.885	41.243
M20728	Pilgrim's Pride Corporation	Waco	TX	-97.127	31.61
M2073	C & F Packing Company	Lake Villa	IL	-88.07	42.41
M2074	Red Barn Butchering	Seminole	TX	-102.633	32.713
M20742	Wanchese Fish Company, Inc.	Suffolk	VA	-76.477	36.814
M20744	Summit Cold Storage, Inc.	Summit	IL	-87.812	41.792
M20747	Baffo's Enterprises	Riverview	MI	-83.189	42.173
M20748	Sig International, Iowa, Inc.	Boyden	IA	-96.006	43.191
M20757	DIPPER'S PACKING CO. INC.	WESTERLY	RI	-71.815	41.373
M20758	Truvant, LLC	Boscobel	WI	-90.693	43.142
M20760	USA Pork Packers Inc	Hazleton	PA	-75.978	40.946
M20761	PFG Virginia Foodservice	Glen Allen	VA	-77.463	37.694
M20766	Arko Veal Company, Inc.	Forest Park	GA	-84.376	33.623
M20774	Kettle Cuisine, LLC	Green Bay	WI	-88.099	44.528
M2078	Schwab & Company	Oklahoma City	OK	-97.531	35.475
M20780	Elysian Fields Farms Inc.	Waynesburg	PA	-80.15	39.962
M20780A	Elysian Fields, LLC	Masontown	WV	-79.791	39.551
M20783	Mr Wok Foods Inc. dba Maxfield Foods	Las Vegas	NV	-115.095	36.074
M20788	Primal Custom Cutting LLC	South Amboy	NJ	-74.293	40.478
M2079	America's Second Harvest of the Big Bend	Tallahassee	FL	-84.326	30.401
M20790	Carso's Pasta Company	Lynnwood	WA	-122.308	47.81
M20793	Sister Schubert's Homemade Rolls, Inc.	Luverne	AL	-86.283	31.734
M20795	Koch Foods	Fairfield	OH	-84.486	39.334
M20795C	Koch Foods	Fairfield	OH	-84.489	39.337
M2080	Lulu Asian Kitchen	Oakland	CA	-122.162	37.756
M2081	Jr Produce and Food Service Inc.	El Paso	TX	-106.406	31.764
M20815	Buckhead Meat & Seafood Mid-Atlantic, Inc.	Landover	MD	-76.901	38.916
M20818	Hanover Foods Corporation	Centre Hall	PA	-77.662	40.838
M20826	Griggstown Quail Farm	Princeton	NJ	-74.602	40.444
M2083	Mountain West Food Group LLC	Heyburn	ID	-113.764	42.55
M20838	Portillo's Hot Dogs, LLC.DBA Portillo's Food Service, LLC.	Aurora	IL	-88.229	41.737
M20842	Siskiyou Distributing	Yreka	CA	-122.596	41.732
M20845	Crystal Lake Foods, LLC	York	NE	-97.596	40.873
M2085	Julia's Southern Foods, LLC	Raleigh	NC	-78.591	35.857
M20852	Kwik Trip, Inc.	La Crosse	WI	-91.226	43.854
M20855	Chenoa Locker, Inc.	Chenoa	IL	-88.719	40.746
M20856	Eureka Locker, Inc.	Eureka	IL	-89.271	40.705
M2086	Southern Integrity LLC	Vinemont	AL	-86.969	34.25
M20860	Southern Meat Processing	Headland	AL	-85.344	31.325
M20862	Olympic Gold Meats, Inc.	Long Beach	CA	-118.199	33.786
M20863	JNB, Inc.	Sioux Center	IA	-96.178	43.087
M20865	Michael Foods Egg Product Company Pilot Plant R&D	Gaylord	MN	-94.197	44.557
M20866	Cattlemen's Processing LLC	Cochise	AZ	-109.847	31.978
M2088	Sadler's Smokehouse, LLC	Henderson	TX	-94.826	32.163
M20882	Mids Spaghetti Sauce	Navarre	OH	-81.521	40.728
M20887	Crescent Foods	Chicago	IL	-87.733	41.813
M20889	Crown I Foods, Inc.	Bay Shore	NY	-73.229	40.735
M2089	Blue Moon Specialty Foods	Spartanburg	SC	-81.931	34.957
M20891	Alaska Meat Packers Incorporated	Palmer	AK	-149.116	61.586
M20892	Delta Meat & Sausage Co.	Delta Junction	AK	-145.5	63.971
M20894	Mike's Quality Meats Inc.	Eagle River	AK	-149.57	61.33
M20898	Alaska Commercial Co.	Anchorage	AK	-149.876	61.152
M20899	C&J Tendermeat Co., Inc.	Anchorage	AK	-149.878	61.173
M208A	National Beef Packing Co., L.L.C.	Liberal	KS	-100.901	37.052
M20900	B&G Meats Inc.	Anchorage	AK	-149.864	61.153
M20902	Teddy's Tasty Meats, Inc.	Anchorage	AK	-149.888	61.165
M20910	Nylund Food, Inc.	Crystal Falls	MI	-88.325	46.097
M20913	A & A Halal Distributors	Orlando	FL	-81.293	28.559
M20917	Behrmann Meat & Processing, Inc.	Albers	IL	-89.609	38.545
M20917A	Behrmann Meat and Processing #2	Albers	IL	-89.612	38.533
M2092	Tam Bien Wholesale Corp.	Santa Ana	CA	-117.902	33.765
M20923	Foster Poultry Farms, LLC	Porterville	CA	-119.007	36.079
M20926	Buckhead Meat Northeast	Edison	NJ	-74.339	40.513
M20935	Michigan Turkey Producers Co-op, Inc.	Wyoming	MI	-85.717	42.93
M20935A	Michigan Turkey Producers Co-op, Inc.	Grand Rapids	MI	-85.695	42.941
M20946	Raandom Corp.	Covina	CA	-117.876	34.093
M20949	Corn Maiden Foods, Inc.	Harbor City	CA	-118.3	33.804
M2095	Nealey's Foods, Inc.	Chicago	IL	-87.726	41.832
M20957	ROMA SAUSAGE, INC.	UTICA	NY	-75.194	43.091
M20965	PBJ, Inc.	Liebenthal	KS	-99.319	38.655
M20968	Nor-Am Cold Storage	Le Mars	IA	-96.188	42.768
M20968A	Nor-Am Logistics, Inc.	Schuyler	NE	-97.099	41.451
M20968B	Nor-Am Cold Storage, Inc.	Le Mars	IA	-96.179	42.787
M20978	Boar's Head Provisions Co., Inc.	Holland	MI	-86.097	42.802
M20981	Riverside Meats	Trenton	NC	-77.345	35.062
M20985	Texas Twist	Carrollton	TX	-96.877	32.955
M20986	Russo Wholesale Meats	Alsip	IL	-87.74	41.669
M20999	La Boucherie, Inc.	Spring	TX	-95.49	30.045
M20AE	Lopez Foods, Inc.	Oklahoma City	OK	-97.683	35.472
M210	Foster Poultry Farms, LLC	Turlock	CA	-120.847	37.484
M21006	Karlsburger Foods, Inc.	Monticello	MN	-93.824	45.304
M21006A	Karlsburger Foods, Inc.	Maple Lake	MN	-94.004	45.234
M2101	Tyson Deli, Inc.	Concordia	MO	-93.564	38.968
M21010	Spartanburg Meat Processing Co., Inc.	Spartanburg	SC	-82.007	34.946
M21012	Lapid Food Inc	Covina	CA	-117.887	34.091
M21016	Major Products Co.	North Las Vegas	NV	-115.085	36.242
M2102	Honest Cut Meats LLC	Ellensburg	WA	-120.331	47.001
M21022	Frank Corriher's Beef & Sausage, Inc.	China Grove	NC	-80.58	35.543
M21024	HBC Holdings, LLC	Sioux City	IA	-96.376	42.426
M2104	Country Meats Inc.,	Arcadia	IA	-95.045	42.087
M2105	Schmitz Diversified Corporation	San Leandro	CA	-122.193	37.723
M21054	Herman Falter Packing Company	Columbus	OH	-83.007	39.941
M21059	Americold Logistics, LLC	Chillicothe	MO	-93.537	39.778
M2106	Buckhead Meat Midwest Inc.	Northwood	OH	-83.527	41.604
M21061	Damn Good Foods Inc.	Stillwater	NY	-73.645	42.947
M21061A	Damn Good Foods Inc.	Stillwater	NY	-73.636	42.954
M21069	Premium Iowa Pork, LLC	Hospers	IA	-95.908	43.073
M21069L	Premium Minnesota Pork, LLC	Luverne	MN	-96.24	43.643
M21069W	Premium Purveyors of Fine Meats, LLC	Windom	MN	-95.1	43.886
M2107	The XCJ Corp.	Monterey Park	CA	-118.162	34.047
M21086	Phayvanh Food Corporation	Dallas	TX	-96.889	32.69
M2109	Cibus Corp.	Visalia	CA	-119.387	36.345
M21094	La Guadalupana	Chicago	IL	-87.713	41.809
M21103	US Foods Inc.	Birmingham	AL	-86.818	33.523
M21108	Gary's Meat	Payson	UT	-111.724	40.026
M21112	Eastern Treats Speciality Food	Orlando	FL	-81.369	28.476
M21115	General Mills Operations, Inc.	Golden Valley	MN	-93.393	44.994
M21125	Bryan's Meat Cutting, Inc.	Milan	PA	-76.642	41.862
M21130	Wallace Foods	Dallas	GA	-84.779	33.921
M21134	Willamette Valley Meat Co.	Portland	OR	-122.657	45.525
M21136	Alpha Omega LLC	Madison	WI	-89.311	43.091
M21141	Steidinger Meat Processing	Fairbury	IL	-88.51	40.747
M21141A	Steidinger Foods	Fairbury	IL	-88.509	40.747
M2115	Taste Africa, LLC	Bakersfield	CA	-118.979	35.397
M21156	Den's Country Meats, Inc.	Table Rock	NE	-96.091	40.179
M21159	Steak Master Inc.	Elwood	NE	-99.868	40.594
M21169	Midway Meats	Winston-Salem	NC	-80.191	35.935
M2117	Night Hawk Frozen Foods, Inc.	Buda	TX	-97.834	30.089
M21171	Cargill Meat Solutions	Fort Worth	TX	-97.293	32.767
M21171A	Smithfield Packaged Meats Corp.	Nashville	TN	-86.756	36.115
M21174	Alef Sausage	Mundelein	IL	-87.982	42.251
M21177	Perdue Foods, LLC Replenishment Center	Prince George	VA	-77.311	37.197
M21179	J&J Packing Co., Inc.	Brookshire	TX	-95.976	29.786
M2118	Ruthven Meat Processing Inc.	Ruthven	IA	-94.897	43.131
M21180	Roots Meat Market LLC	Fremont	OH	-83.186	41.374
M21183	New England Meat Packing, LLC	Stafford Springs	CT	-72.288	41.968
M21187	Shaffer Vension Farms, Inc.	Herndon	PA	-76.841	40.69
M21188	Slagel Slaughter	Forrest	IL	-88.41	40.75
M2119	Barrera Foods INC	Tulsa	OK	-96.086	36.042
M21190	Riverview Meat Company, LLC	Cynthiana	KY	-84.301	38.395
M21196	Southern Hens, Inc.	Moselle	MS	-89.306	31.526
M21198	Slaughter House Inc.	Jamaica	NY	-73.802	40.7
M21200	VF America, LLC	Statham	GA	-83.592	33.96
M21202	Halsey Food Service	Madison	AL	-86.74	34.693
M21207	Lorentz Etc. Inc.	Cannon Falls	MN	-92.911	44.538
M2121	Smithfield Packaged Meats Corp.	Arnold	PA	-79.769	40.584
M21214	Pasha USA LLC	Bayonne	NJ	-74.121	40.66
M21217	Hacienda Central, Inc.	Juncos	PR	-65.914	18.174
M21217A	Procesadora La Hacienda, Inc.	San Lorenzo	PR	-65.96	18.184
M2121A	Smithfield Packaged Meats Corp.	Cumming	GA	-84.151	34.192
M21230	Fearless Innovation Food Company, LLC	New Albany	IN	-85.825	38.343
M21235	The Smokehouse	Graham	MO	-95.038	40.201
M21237	Joe's Beef Jerky	Statesville	NC	-80.95	35.733
M21254	William & Co., Inc.	Boston	MA	-71.066	42.33
M21255	IQM Interfood Inc.	Hammonton	NJ	-74.811	39.634
M2126	Double-D Group	Greenville	KY	-87.219	37.225
M21263	Wayne Farms LLC	Decatur	AL	-87.048	34.611
M21265	Smucker's Meats	Mt. Joy	PA	-76.507	40.089
M21269	Bobby Salazar's Food Products, Inc.	Fowler	CA	-119.653	36.603
M2127	The Dough Connection	Wilmington	MA	-71.156	42.527
M21275	D&D Foods Inc.	Omaha	NE	-95.984	41.346
M21276	Tyson Fresh Meats, Inc.	Madison	NE	-97.468	41.818
M2128	John Soules Foods Inc.	Tyler	TX	-95.278	32.411
M21282	Quintero's Meat Co. Inc.	El Paso	TX	-106.438	31.776
M21282A	Garcia's Meat Company, LLC	El Paso	TX	-106.358	31.796
M21284A	M.G. Trading Inc.	Saddle Brook	NJ	-74.1	40.894
M21285	Harvest House Farms	Johnson City	TX	-98.411	30.281
M21289	El Puerquito De Oro, Inc	Passaic	NJ	-74.116	40.865
M21293	Bern Meat Plant	Bern	KS	-95.971	39.963
M2130	Cooper Farms Processing	St. Henry	OH	-84.622	40.426
M21307	Broadleaf Inc.	Vernon	CA	-118.237	33.991
M21309	Belmont Sausage Company	Elk Grove Village	IL	-87.948	42.006
M21309A	Belmont Sausage No. 3	Bensenville	IL	-87.955	41.978
M2131	Dakota Tom Sandwiches, Inc	Corsica	SD	-98.407	43.424
M2132	AdvancePierre Foods, Inc.	Cincinnati	OH	-84.463	39.308
M21328	Lineage Logistics LLC	Milwaukee	WI	-88.051	43.192
M2133	Cargill Meat Solutions	Albert Lea	MN	-93.356	43.626
M21332	Werling and Sons, Inc.	Burkettsville	OH	-84.644	40.348
M21334	Rainbow Organic Farms Co.	Uniontown	KS	-94.977	37.847
M21335	Wurst Works	Manor	TX	-97.558	30.252
M21340	National Custom Pkg., Inc.	Castroville	CA	-121.743	36.757
M21342	Wan Rong Trading Corp., DBA Taihe Trading Corp.	Long Island City	NY	-73.934	40.74
M21350	White Castle System, Inc.	Zanesville	OH	-81.887	39.941
M21352	Mcbride Meats Company, Inc.	South Pittsburg	TN	-85.663	35.008
M21356	La Buona Pasta	Hialeah	FL	-80.318	25.851
M21357	Elaboraciones Fiesta	Aguada	PR	-67.143	18.35
M21371	Yants Snack Foods LLC	Jackson Center	OH	-84.041	40.445
M21372	Mason Brothers Company	Wadena	MN	-95.128	46.443
M21377	Cargill Kitchen Solutions, Inc	Mason CIty	IA	-93.232	43.136
M2139	Glier's Meats, Inc	Covington	KY	-84.518	39.077
M21393	Champion Gourmet Products	San Gabriel	CA	-118.103	34.098
M21397	Tyson Prepared Foods, Inc.	Waterloo	IA	-92.263	42.508
M214	Dold Foods, LLC.	Wichita	KS	-97.326	37.736
M2140	U.S. Foods, Inc.	Chesterfield	MO	-90.605	38.664
M21406	Crawford Sausage Co., Inc.	Chicago	IL	-87.725	41.849
M2141	Henry Kaminski, Inc.	Chicago	IL	-87.646	41.826
M21418	GB Green Gastronome, LLC	Queens Village	NY	-73.734	40.719
M21424A	Twin Marquis, LLC	Brooklyn	NY	-73.939	40.708
M21425	New S & N Meat Market, Inc	Brooklyn	NY	-74.022	40.647
M21430	Bert Posess Inc	Paterson	NJ	-74.145	40.936
M21433	LATIN AMERICA MEATS AND FOODS CORP	Miami	FL	-80.328	25.836
M21436	Champ Meatball Company Inc.	Whittier	CA	-118.052	33.961
M2144	Barnes Company Limited LLC	Pryor	OK	-95.203	36.305
M21442	Kased Brothers' Halal Meats	Summit	MS	-90.586	31.281
M21444	Uli's Famous Sausage LLC	Seattle	WA	-122.311	47.595
M21445	Parayil Foods USA, LLC	Jersey City	NJ	-74.071	40.741
M2145	Penn Valley Meats, LLC	Millersburg	PA	-76.865	40.56
M2146	Creek Ranch Inc.	Boyd	TX	-97.584	33.029
M21465B	Water Lilies Food, LLC	Bayshore	NY	-73.263	40.766
M21467	United Source One, Inc.	Belcamp	MD	-76.23	39.476
M21468A	S. E. Meats Inc	Birmingham	AL	-86.854	33.44
M21469	The Lamb Cooperative, Inc.	Compton	CA	-118.221	33.85
M21480B	LandMark Snacks, LLC	Beatrice	NE	-96.744	40.281
M21488	OWB Packers, LLC	Brawley	CA	-115.52	32.996
M21498	Ozark Mountain Poultry Inc.	Rogers	AR	-94.124	36.347
M21510	RRT Distributors Coporation	Trujillo Alto	PR	-66.007	18.349
M21523	Morski Brands, Inc.	Portage	WI	-89.494	43.562
M21526	National Beef Packing Co., LLC	Selinsgrove	PA	-76.838	40.83
M21528	Florida Beef Inc.	Zolfo Springs	FL	-81.787	27.502
M21529	Heinkel's Packing Company, Inc.	Decatur	IL	-88.929	39.863
M21530	Tex-Mex Machitos, LLC	Mission	TX	-98.37	26.243
M21538	Cooper-Wilson Inc.	Beloit	WI	-89.029	42.499
M21539	Cooper's Country Meat Packers	Florence	MS	-90.107	32.147
M2154	North Shore Foods LLC	Hopkins	MN	-93.396	44.929
M21544	Lee's Oriental Gourmet Inc.	Shenandoah	PA	-76.201	40.824
M21547	LPB, Inc.	Earlham	IA	-94.125	41.491
M21549	Ashland Sausage Company	Carol Stream	IL	-88.129	41.897
M21550	Webermans	Miami	FL	-80.189	25.83
M21551	Cheese Pleasers Inc.	Bancroft	WI	-89.521	44.309
M21554	Grizzly's Custom Cutting Inc.	Hunt	NY	-78.029	42.543
M21556	San Guiseppe Salami Co. by Giacomo	Elon	NC	-79.508	36.161
M21558	El Greg Inc.	Chicago	IL	-87.73	41.991
M2156	Spruce Hill Meats	Bowman	ND	-103.432	46.182
M21572	Robert Winner Sons Inc.	Yorkshire	OH	-84.488	40.34
M21577	Southside Market & Barbeque	Elgin	TX	-97.386	30.35
M21585	Kiowa Locker System, LLC	Kiowa	KS	-98.486	37.016
M21585A	Kiowa Locker System	Kiowa	KS	-98.486	37.017
M2159	Rob-Dav Distributors Inc.	Allentown	NJ	-74.609	40.173
M21594	Apostolic Christian HarvestCall	Sterling	OH	-81.793	40.916
M21595	Mayar's Halal Meat Processing	Livingston	CA	-120.726	37.408
M2160	Pride of Iowa	Grinnell	IA	-92.747	41.745
M21600	Inland Market Premium Foods	Tucker	GA	-84.254	33.83
M21600B	Inland Market Premium Foods - RTE Division	Stone Mountain	GA	-84.186	33.831
M21601	Vitale Meats Poultry & Provisions LLC	Columbus	OH	-82.955	39.925
M21602	Exel Inc.	Dayton	OH	-84.283	39.774
M2161	Mountaire Farms, Inc.	Millsboro	DE	-75.26	38.6
M21611	EUROSTYLE DELI, INC	Skokie	IL	-87.75	42.026
M21614	Chaparro's Tamales	West Haven	UT	-112.029	41.212
M21615	Cooper's Old Time Pit Bar-B-Que, Inc	Llano	TX	-98.681	30.759
M21616	SME  Foods, LLC	York	PA	-76.728	40.014
M21621	Americold Logistics LLC	Benson	NC	-78.515	35.414
M21622	Mi Ranchito, Inc.	Passaic	NJ	-74.11	40.859
M21627	Webb Properties, LLC	Payneville	KY	-86.329	38.014
M21634	Double R Brand Foods, LLC	Brenham	TX	-96.58	30.186
M21634A	Double R Brand Foods, LLC	Lufkin	TX	-94.718	31.374
M21648	Asianic Inc.	Oak Park	IL	-87.78	41.88
M21651	Peoria Packing LTD	Grant Park	IL	-87.645	41.239
M2166	Carl Streit & Son Co.	Neptune	NJ	-74.022	40.203
M21660	Lechi Food Corporation	LaPorte	TX	-95.067	29.652
M2167	Groezinger Provisions, Inc.	Neptune	NJ	-74.022	40.204
M21670	Meyers Sausage Co, Inc	Elgin	TX	-97.368	30.341
M21679	National Beef Packing Co., LLC	Moultrie	GA	-83.792	31.195
M2168	Waseca Morgans Meat Market LLC	Waseca	MN	-93.509	44.089
M2169	HCSD Agri-Business Center	Gainesville	GA	-83.813	34.415
M21695	R. Whittingham & Sons	Alsip	IL	-87.723	41.662
M21699	Molokai Livestock Cooperative	Ho'olehua	HI	-157.085	21.154
M2170	Salchert's Market, Inc	Saint Cloud	WI	-88.166	43.824
M21700B	Island Grown Farmer's Cooperative	Burlington	WA	-122.409	48.479
M21701	Alena Foods, Inc.	Fresno	CA	-119.781	36.726
M21710	Harczak Sausage	Chicago	IL	-87.804	41.98
M21711	Mama Russo's	Ishpeming	MI	-87.714	46.488
M21712	Glatt Boy's Inc.	Bronx	NY	-73.872	40.807
M21716	Tyson Prepared Foods, Inc.	Council Bluffs	IA	-95.89	41.243
M21723	H & M Butchering	Manchester	KY	-83.764	37.184
M21725	888 Food Company	South El Monte	CA	-118.061	34.053
M21725A	GP Food Company	Temple City	CA	-118.057	34.086
M21725B	888 Food Company	Temple City	CA	-118.058	34.087
M2173	Hinck Turkey Farm Inc	Neptune	NJ	-74.097	40.194
M21734	Joseph Epstein Foods Inc.	East Rutherford	NJ	-74.093	40.82
M21734B	T&L Creative Salads	Farmingdale	NY	-73.415	40.717
M21738	Barron's Creek Beef Jerky	Rock Island	TN	-85.724	35.835
M21741	GA Small Ruminant Research and ExtCenter Ag Research College of Ag	Fort Valley	GA	-83.898	32.538
M21743	Alfresco Pasta, LLC	Bells	TN	-89.09	35.739
M21747	Flowers Slaughter House	Sims	NC	-78.035	35.743
M21748	B & R Bierocks, Inc.	St. Francis	KS	-101.796	39.771
M21750	Lao Thai Nam Corp	Dallas	TX	-96.894	32.719
M21763	Gardners BBQ	Rocky Mount	NC	-77.797	35.974
M21765	Performance Food Group	Temple	TX	-97.347	31.143
M2177	Tom's Slaughter House	Montreal	MO	-92.667	38.045
M21780	Burt's Meat & Poultry	Eyota	MN	-92.229	43.988
M21782	Nixon Family Restaurant, Inc.	Edenton	NC	-76.712	36.2
M2179	CHICAGO BUTCHER SHOPS, INC	LAKE FOREST	IL	-87.898	42.276
M21790	Embutidos Vallecrespo	Hatillo	PR	-66.798	18.414
M21794	Taylor Farms Illinois, Inc	Chicago	IL	-87.688	41.885
M21795	PFG Hale	Morristown	TN	-83.379	36.169
M21797	Zook's Homemade Chicken Pies, LLC	Paradise	PA	-76.085	40.002
M21798	South Mountain Farms	Lawndale	NC	-81.522	35.461
M21799	Olson Meat Plant	Orland	CA	-122.107	39.788
M218	Rudolph Foods Company, Inc.	Dallas	TX	-96.882	32.769
M21802A	Brother and Sister Food Services Inc.	Camp Hill	PA	-76.924	40.232
M2181	Scratch Made Awesomeness, LP	Harrisburg	PA	-76.85	40.247
M21810	General Snack Foods	Lancaster	PA	-76.214	40.064
M21816	Meat Masters, Inc.	Decatur	GA	-84.281	33.731
M2182	Marder Trawling, Inc., DBA Marder Seafood	New Bedford	MA	-70.917	41.627
M21826	Peoria Packing, Ltd.	Chicago	IL	-87.738	41.866
M21827	GoodTimes Beef Jerky	Stratford	OK	-96.96	34.811
M21831	Pasta-Bilities	Indianapolis	IN	-86.075	39.881
M21837	Contessa Premium Foods	Vernon	CA	-118.208	33.988
M21838	Bachoco OK Foods	Albertville	AL	-86.179	34.253
M2184	Contender Meat Purveyors, LLC	Hialeah	FL	-80.347	25.897
M21847	Jennette Brothers, Inc.	Elizabeth City	NC	-76.218	36.302
M21848	Wayne Mays Meat Processing	Taylorsville	NC	-81.166	35.922
M21854	Cattaneo BBQ Service	San Luis Obispo	CA	-120.616	35.209
M21855	Productos La Hortaliza	Anasco	PR	-67.143	18.296
M21861	Flores Brothers Inc.	Bell Gardens	CA	-118.148	33.961
M21863A	Rio Grande Pak Foods	McAllen	TX	-98.275	26.159
M21867	Palumbo's Meat Market	West Middlesex	PA	-80.496	41.17
M21869	Out of the Shell, LLC.	South El Monte	CA	-118.058	34.048
M21869A	Out of the Shell LLC.	Pomona	CA	-117.752	34.093
M21874	Rosemead Processing Meats, Inc.	South El Monte	CA	-118.067	34.057
M21882	S&S Gilardi, Inc.	Mount Vernon	OH	-82.482	40.369
M21888	Fiore Meats LLC	Buckhannon	WV	-80.235	38.969
M2189	Texas Jerky Shack	Azle	TX	-97.586	32.914
M21894	Pacific Coast Fruit	Portland	OR	-122.664	45.524
M21896	Williams Foods, Inc.	Rocky Mount	NC	-77.793	35.951
M21898	Farmers Union Industries, LLC	Estherville	IA	-94.811	43.393
M219	Mediterranean Fine Foods	New Bedford	MA	-70.922	41.622
M2190	Mei Mei	Boston	MA	-71.056	42.336
M21902	Onofrio's Fresh Cut Inc.	New Haven	CT	-72.898	41.295
M21905	Ortega's Meat Distribution	Fresno	CA	-119.819	36.717
M21924	Marketplace Deli Products Inc.	Phoenix	AZ	-112.097	33.437
M21929	ALMI Group, Inc.	Philadelphia	PA	-75.124	40.033
M21930I	Fresh Mark Cold Storage	Massillon	OH	-81.492	40.786
M21934A	Lineage Logistics PFS, LLC	Wilmington	CA	-118.252	33.788
M21938	EcoFriendly Foods	Moneta	VA	-79.594	37.215
M2194	Pat's Pastured	East Greenwich Road	RI	-71.508	41.608
M2197	Major Products Co., Inc.	Little Ferry	NJ	-74.035	40.846
M2198	Paris Frozen Foods	Hillsboro	IL	-89.497	39.164
M2199	Omni Custom Meats, Inc.	Bowling Green	KY	-86.401	36.925
M21B	Gerber Products Company	Fort Smith	AR	-94.381	35.431
M2200	Porch Swing Farms	Little Rock	AR	-92.302	34.763
M2201	Webers Quality Meats	San Leandro	CA	-122.185	37.719
M2202	Wonder Group, Inc.	Cranford	NJ	-74.283	40.644
M22022	National Meat & Provisions, LLC	Reserve	LA	-90.566	30.064
M22029	Taylors Meat Processing	Spanishburg	WV	-81.108	37.444
M22042	Illini Institutional Foods, Inc.	Rantoul	IL	-88.178	40.309
M22048	T.K.O.	Cedar Lake	IN	-87.461	41.375
M22052	Corfini Meat and Seafood	Chula Vista	CA	-117.058	32.593
M22054	Premier Foods	Phoenix	AZ	-112.096	33.456
M22057	Godo's Restaurant & Oriental Mart	Houston	TX	-95.401	29.698
M22059	Broken Arrow Ranch, Inc.	Ingram	TX	-99.236	30.074
M22061	NuVue Foods	Hamtramck	MI	-83.045	42.393
M22069	Glory's Bakery	Virginia Beach	VA	-76.145	36.856
M22070	New York Meat, Inc.	Bronx	NY	-73.872	40.807
M22076	Buckhead Meat Midwest Inc	Hampshire	IL	-88.505	42.134
M2208	Terry's Meat Processing	Blountsville	AL	-86.632	34.098
M22080	International Meat Co.	Chicago	IL	-87.803	41.923
M22084	Wisdom Natural Poultry	Haxtun	CO	-102.728	40.453
M2209	New Braunfels Smokehouse	New Braunfels	TX	-98.133	29.7
M22094A	Del Real, LLC	Mira Loma	CA	-117.525	34.031
M22095	Creston Valley Meats	Creston	CA	-120.455	35.461
M22097	Holifield Farms, Inc.	Covington	GA	-83.915	33.563
M2210	Hayes Meat Processing	Cordova	AL	-87.092	33.791
M22102	Valley Fine Foods Company, Inc.	Benicia	CA	-122.128	38.071
M22102A	Valley Fine Foods Company, Inc.	Yuba City	CA	-121.612	39.111
M22104	Nital Trading Co Inc	Hialeah	FL	-80.372	25.927
M2211	FREED, LLC	Tyler	TX	-95.274	32.35
M2212	Meatco Inc.	Oakland	CA	-122.276	37.802
M2213A	Buckhead Meat of San Antonio	San Antonio	TX	-98.412	29.44
M2213D	Buckhead Meat Dallas a Sysco Company	Dallas	TX	-96.889	32.685
M2214	Sunrise Meats LLC	Princeton	MO	-93.73	40.287
M2216	Yoakum Packing Co.	Yoakum	TX	-97.15	29.289
M2218	Uncle Abies Factory LLC	Linden	NJ	-74.236	40.646
M221A	Smithfield Fresh Meats Corp.	Smithfield	VA	-76.63	36.995
M222	Smithfield Packaged Meats Corp.	Mason City	IA	-93.258	43.14
M2220	Moore & Moores Catfish Co. LLC	Vance	SC	-80.408	33.447
M2221	Valentino's Oven Loven	Lincoln	NE	-96.697	40.728
M2225	Blueridge processing Corp	Marion	NC	-81.952	35.651
M2226	Coursey's Smoked Meats	St.Joe	AR	-92.763	35.998
M2228	VM LA Sultana Products Corp	Middel Village	NY	-73.876	40.708
M2233	Shirley's Dream Inc.	Albuquerque	NM	-106.68	35.029
M2235	Despieces La Ceba, LLC	Catano	PR	-66.149	18.43
M2241	Silsa Miami Corp.	Miami	FL	-80.233	25.796
M2242	Three Rivers Meat Company	Smithville	OK	-94.675	34.509
M2243	YODERS BUTCHER BARN	grantsville	MD	-79.097	39.701
M2248	Wei Ming USA, Inc.	Maspeth	NY	-73.916	40.718
M2249	Bonneval Foods LLC	Gonzales	LA	-90.886	30.216
M2253	Carne Seca Los Guerra	Baytown	TX	-94.977	29.721
M2254	Continental Foods	Chicago	IL	-87.664	41.777
M2255	Lone Star Beef Processors	San Angelo	TX	-100.403	31.498
M2257	Stallings Head Cheese Co.	Houston	TX	-95.416	29.734
M2259	Olive & Finch Comm, LLC	Denver	CO	-104.924	39.679
M226	Independent Meat Company	Twin Falls	ID	-114.443	42.533
M2260E	AdvancePierre Foods, Inc.	Enid	OK	-97.807	36.417
M2260T	Gold Creek Foods, LLC	Caryville	TN	-84.21	36.315
M2260Y	AdvancePierre Foods, Inc.	Enid	OK	-97.799	36.396
M2261	Robertson's Hams, Inc.	Marietta	OK	-97.13	33.942
M2264	Tamales Del Valle	Salem	OR	-123.028	44.971
M2267	D6 Processing LLC	iron Station	NC	-81.085	35.439
M2268	LSG Sky Chefs	Charlotte	NC	-80.925	35.2
M2269	Tyson Refrigerated Processed Meats, Inc.	Vernon	TX	-99.293	34.162
M226B	Independent Meat Company	Twin Falls	ID	-114.456	42.541
M2270	Two Creek Farms LLC	Union Grove	WI	-88.057	42.681
M2272	Whiskey Creek Cattle, LLC	Madill	OK	-96.827	34.099
M2274	Lone Star Meats Ltd.	Austin	TX	-97.725	30.214
M2276	Fresh & Ready Foods LLC	Renton	WA	-122.243	47.474
M2278	Seven Oaks Meat Processing	Sallisaw	OK	-94.744	35.467
M2279	Frutarom USA, Inc.	Corona	CA	-117.554	33.883
M2281	Pimento's Foods Inc.	El Paso	TX	-106.454	31.774
M2282	Century Harvest Farms LLC	Greenback	TN	-84.147	35.688
M2286	Prejean's Wholesale Meats Inc.	Carencro	LA	-92.042	30.323
M2289	Tyson Prepared Foods, Inc.	N. Richland Hills	TX	-97.245	32.852
M2292	Ouray Meat and Cheese Market	Ouray	CO	-107.672	38.025
M2294	Hans Kissle	Dallas	NC	-81.226	35.31
M2295A	Jedediah Corporation	Jackson	WY	-110.795	43.461
M2296	Primo Smokehouse & Kitchen, LLC	Ballinger	TX	-99.96	31.735
M2298	Deen Meat and Cooked Foods, Inc.	Fort Worth	TX	-97.338	32.779
M2300	Fresh Texas LLC	Austin	TX	-97.672	30.276
M2304	FreshPoint Central Florida	Orlando	FL	-81.41	28.438
M2307	Paxos Foods, LLC	Allentown	PA	-75.447	40.628
M2308	Roadhouse Market LLC	Durango	CO	-107.796	37.227
M2311	Malu's Foods Corp	Atlanta	GA	-84.265	33.886
M2312	E.A. Sween Company	Hodges	SC	-82.222	34.324
M2314	J & D Foods, Inc.	Albuquerque	NM	-106.649	35.068
M2317	Cave Springs Meats, LLC	Smithland	KY	-88.401	37.379
M2318	Louisa Food Products, Inc.	St Louis	MO	-90.254	38.717
M2320	L & C Meat Co., Inc.	Independence	MO	-94.366	39.093
M2321	Long Hollow Cattle Company	Bloomsburg	PA	-76.416	41.035
M2327	Iowa Pacific Processors, Inc.	Des Moines	IA	-93.653	41.565
M2329	Harrison Harvesting And Processing LLC	Carlisle	KY	-84.124	38.324
M233	Conagra Brands (Conagra Foods Packaged Foods, LLC)	Russellville	AR	-93.095	35.276
M2334	Oberle Meats	St. Genevieve	MO	-90.065	37.959
M2335	Win-A-Nell Butchering and Meats, LLC	New Oxford	PA	-77.113	39.848
M2336	Swine & Bovine Processing, LLC	Wray	CO	-102.224	40.095
M2338	Keith Valley Packing Company	Dallas	TX	-96.859	32.768
M2342	Buckeye Butcher, LLC	Buckeye	AZ	-112.574	33.37
M2347	House of Solomon, LLC	Brooklyn	NY	-73.97	40.68
M2348	All American Meat Processing & Smokehouse	Pulaski	TN	-87.092	35.158
M235	Washington Beef, LLC	Toppenish	WA	-120.332	46.373
M2350	Miller Charm Farm, LLC	Tamaqua	PA	-75.868	40.777
M2352	Circle P Meats	Taylorsville	NC	-81.122	35.859
M2353	Derks Meats LLC	Boyd	WI	-90.992	45.009
M2356	HEB Fresh Plant	San Antonio	TX	-98.361	29.413
M2357	Amana Meat Shop & Smokehouse	Amana	IA	-91.869	41.802
M2358	Abuela's Foods Company	Riviera Beach	FL	-80.066	26.778
M2359	IHMAC Prepared Foods	Hollywood	FL	-80.204	26.01
M236	Texas Tech University, Gordon W. Davis Meat Science Laboratory	Lubbock	TX	-101.888	33.583
M2360	Empresa Ebenezer Inc.	Ciales	PR	-66.467	18.353
M2361	Hi-Line Packing	Malta	MT	-107.844	48.366
M2364	Lauretta Jean's	Portland	OR	-122.654	45.518
M2365	Performance Food Group, Inc.	Berkley	MO	-90.325	38.726
M2366	Ben-Lee Processing Inc.	Atwood	KS	-101.046	39.831
M2375	Serenade Foods, Division of Maple Leaf Farms, Inc.	Milford	IN	-85.808	41.366
M2376	Top Salgados by Sandra Carvalho	Longwood	FL	-81.346	28.689
M2377	Johnsons Sausage Shoppe	Rio	WI	-89.246	43.445
M2378	Stevison Ham Company	Portland	TN	-86.528	36.591
M2379	Backroad Meats Inc.	Milaca	MN	-93.641	45.789
M2381	Cordray's Venison Processing, Inc.	Ravenel	SC	-80.276	32.845
M2382	Direct Source Meats-Albuquerque	Albuquerque	NM	-106.716	35.081
M2383	Clear Water Meats	Eau Claire	MI	-86.301	42.01
M2387	Vuetastic Jerky LLC	Salem	OR	-123.002	44.981
M2388	Sawtooth Meats, Inc.	Rison	AR	-92.037	33.81
M2389	Famous Natchitoches LA Meat Pie Co.	Coushatta	LA	-93.343	32.028
M2390	Negril, Inc.	Linthicum	MD	-76.655	39.226
M2399	Whiskey Ridge	Radisson	WI	-91.212	45.773
M24	Cherry Meat Packers, Inc.	Chicago	IL	-87.695	41.807
M2403	Colorado Premium Foods	Greeley	CO	-104.719	40.389
M2404	R and D Meats	Jennings	OK	-96.57	36.181
M2405	Link Snacks Inc	Mankato	MN	-93.993	44.184
M2408	Tatlong ltlog, LLC	Elk Grove Village	IL	-88.026	41.993
M2412	Humpty's Food Group	Sharon Hill	PA	-75.262	39.901
M2416	Klassen Custom Butchering, LLC	Seminole	TX	-102.65	32.655
M2417	Rolling Range Custom Butchering	Chambersburg	PA	-77.573	39.888
M242	ECP Foods LLC	Greenwood	SC	-82.144	34.191
M2420	Cher-Make Sausage Company	Manitowoc	WI	-87.685	44.085
M2421	BUREK ETC LLC	Wyoming	MI	-85.649	42.904
M2422	Old Wisconsin Sausage Co. Inc.	Sheboygan	WI	-87.738	43.731
M2422B	Old Wisconsin Sausage, Inc.	Sheboygan	WI	-87.764	43.703
M2426B	Milwaukee Craft Meats, LLC., d/b/a Klement's Sausage Company	Milwaukee	WI	-87.911	42.997
M2427	Chisholm Trail Meats, LLC	Enid	OK	-97.802	36.415
M2428	Sir Delicious	Rochester	NY	-77.576	43.176
M2429	Harvest Foods, LLC	Holtwood	PA	-76.295	39.846
M2430	CSS Caribbean Meal LLC	Newnan	GA	-84.8	33.45
M2434	Buckhorn Meat Co.	Esparto	CA	-122.014	38.688
M2435	The Hillshire Brands Company	New London	WI	-88.734	44.372
M2436	Fajita Haus Meat Processors LLC	McAllen	TX	-98.258	26.207
M2437	Benson + Turner Foods, Inc.	Waubun	MN	-95.933	47.189
M2438	Sugar Creek Meat Processing LLC	Oldfort	TN	-84.801	34.99
M2439	Old Salt Meat Company DBA Ranchland Packing	Butte	MT	-112.552	45.997
M244	Tyson Fresh Meats, Inc.	Storm Lake	IA	-95.188	42.64
M2446	Formosa Food Company Inc.	Hull	IA	-96.136	43.185
M2447	Sandridge Food Corporation	Medina	OH	-81.903	41.138
M2448	Badger Boiled Ham Co., Inc.	Milwaukee	WI	-87.959	43.003
M244C	Tyson Fresh Meats, Inc.	Council Bluffs	IA	-95.888	41.242
M244G	Tyson Fresh Meats, Inc.	Goodlettsville	TN	-86.711	36.331
M244I	Tyson Fresh Meats, Inc	Logansport	IN	-86.393	40.734
M244L	Tyson Fresh Meats, Inc.	Columbus Junction	IA	-91.356	41.295
M244M	Tyson Fresh Meats, Inc	Madison	NE	-97.468	41.818
M244S	Tyson Fresh Meats, Inc.	Sherman	TX	-96.605	33.581
M244U	Tyson Fresh Meats, Inc	Eagle Mountain	UT	-112.076	40.303
M244W	Tyson Fresh Meats, Inc.	Waterloo	IA	-92.263	42.508
M2450	Daily's Premium Meats	Missoula	MT	-114.036	46.884
M2451	E.A. Sween Company	Eden Prairie	MN	-93.481	44.861
M2457	Chawdhury Farm and Meat Processing	Sterling Township	PA	-75.412	41.366
M2458	Bakalars Sausage Co., Inc.	La Crosse	WI	-91.222	43.862
M2459	Delicacy Meats, LLC	Honey Brook	PA	-75.831	40.094
M245C	Tyson Fresh Meats, Inc.	Dakota City	NE	-96.416	42.423
M245E	Tyson Fresh Meats, Inc.	Amarillo	TX	-101.649	35.259
M245J	Tyson Fresh Meats, Inc.	Hillsdale	IL	-90.225	41.556
M24601	Ready Alliance Group, Inc	Salt Lake City	UT	-111.991	40.746
M2461	Nestle USA, Inc.	Medford	WI	-90.341	45.123
M2462	Ethnic Food Concepts, LLC	Olathe	KS	-94.805	38.848
M2465	Yummy Yum Food	Los Angeles	CA	-118.261	33.974
M2466	Wholesale Meats & More	Canutillo	TX	-106.601	31.911
M2467	Ansots Okeldegi, LLC	Boise	ID	-116.199	43.579
M2468	Sweet Kaki's, LLC	Newnan	GA	-84.994	33.387
M2469	The Meat Market Inc.	Fresno	CA	-119.801	36.845
M2470	Feast Food Enterprises	Reading	PA	-75.871	40.326
M2472	Jack Link's Beef Jerky	Minong	WI	-91.83	46.091
M2473	Brents Beef Jerky	Picayune	MS	-89.574	30.534
M2475	Roundman's Smokehouse	Fort Bragg	CA	-123.806	39.446
M2477	Beacon Fisheries, Inc.	Jacksonville	FL	-81.514	30.123
M2478	Fortune Wisconsin LLC	Windsor	WI	-89.335	43.2
M2481	Nilssen's Market	Clear Lake	WI	-92.271	45.255
M2482	P3 Custom Meats LLC	Dunlap	TN	-85.288	35.507
M2485	De la Montana LLC	Twin Lakes	WI	-88.247	42.535
M2487	Fresh Healthy Habits	Gardena	CA	-118.269	33.897
M2488	Captain Ken's Foods, Inc.	St Paul	MN	-93.08	44.935
M2489	The Doner Factory	Arcadia	CA	-118.008	34.102
M248A	Tony Downs Foods	Madelia	MN	-94.419	44.046
M248B	Butterfield Foods Company	Butterfield	MN	-94.793	43.958
M248D	TDF Inspection and Processing	Madelia	MN	-94.418	44.054
M2490	QUICK FOOD WRAPS L.L.C.	MADISON HEIGHTS	MI	-83.111	42.512
M2491	Lowcountry Food Bank	Early Branch	SC	-80.962	32.721
M2492	Ye Olde Butcher Shoppe	Rochester	MN	-92.476	44.031
M2493	East Texas Slaughter & Packing	Laneville	TX	-94.785	32.061
M2494	Pies of London	Elk Grove Village	IL	-88.026	41.993
M2495	American Heritage Beef Company LLC	Nowata	OK	-95.683	36.728
M2498	Silver Creek Specialty Meats Inc.	Oshkosh	WI	-88.538	43.986
M25	Pilgrim's Pride Corporation	Moorefield	WV	-78.97	39.059
M2503	Muleshoe Meat Processing	Muleshoe	TX	-102.725	34.223
M2504	OSI Industries, LLC	Chicago	IL	-87.653	41.811
M2505	9 Star Foods, Inc.	Wilmington	CA	-118.249	33.782
M2508	The Bruss Company	Chicago	IL	-87.738	41.946
M2509	Pioneer Wholesale Meat	Chicago	IL	-87.685	41.885
M251	OSI Industries, LLC	Chicago	IL	-87.765	41.803
M2510	Best Choice Meats	Alsip	IL	-87.717	41.663
M2512	Monogram Frozen Foods	Bristol	IN	-85.81	41.716
M2514	Four Star Foods	Chicago	IL	-87.671	41.847
M2516	Carl Buddig and Company	Montgomery	IL	-88.369	41.741
M2517	J & J Smokehouse	Ford City	PA	-79.553	40.75
M2518	AMPC, LLC	Dalton	GA	-84.985	34.665
M252	Boston Lamb and Veal	Boston	MA	-71.068	42.331
M2522	Alsleben Meats, LLC.	Glencoe	MN	-94.151	44.771
M2525	King Food Service, Inc.	Rock Island	IL	-90.627	41.443
M253	Long Prairie Packing Company, LLC	Long Prairie	MN	-94.866	45.977
M2530	Moosehead Meats	Smyrna	ME	-68.095	46.14
M2534	Great Western Beef Company	Chicago	IL	-87.646	41.82
M2537	Fiesta Meats LLC	Elephant Butte	NM	-107.217	33.161
M2539B	Great Kitchens Food Company, INC	Romeoville	IL	-88.107	41.613
M2540	KBDetroit, LLC	Detroit	MI	-83.036	42.348
M2541	Total Packaging of Kentucky, INC.	Owensboro	KY	-87.12	37.724
M2542	Epicurean Delights LLC	Westwego	LA	-90.153	29.899
M2543	TK America Inc.	Ontario	CA	-117.562	34.063
M2548	Yoder's Butcher Block	Montezuma	GA	-83.972	32.301
M2549	Lone Pine Abattoir, LLC	Seffner	FL	-82.323	28.019
M2551	Q'Delicia LLC	Jacksonville	FL	-81.56	30.275
M2553	West Coast Dumpling Company	Sedro-Woolley	WA	-122.237	48.503
M2554	VIE Meats	Vancouver	WA	-122.636	45.655
M2557	Almena Meat Company, Incorporated	Almena	WI	-92.039	45.41
M2557C	Almena Meat Company, Incorporated	Cumberland	WI	-92.011	45.483
M2559	Academy Packing Co Inc	Dearborn	MI	-83.151	42.308
M256	The Taylor Provisions Company	Trenton	NJ	-74.75	40.227
M2560	Whalens Meat Packing LLC	Mott	ND	-102.308	46.371
M2561	Elsie Mae Sweet Shop LLC	Lake Mills	WI	-88.893	43.072
M2562	Burnett Dairy Cooperative	Grantsburg	WI	-92.7	45.773
M2563	Papa Banh Bao	Tukwila	WA	-122.248	47.45
M2565	Wild Country Meats	Hominy	OK	-96.386	36.415
M2570	LIC COM, LLC	bronx	NY	-73.888	40.811
M2572	Prime Fish LLC	Santa Monica	CA	-118.474	34.024
M2574	Wolverine Packing Co.	Detroit	MI	-83.041	42.346
M2574A	Wolverine Packing Company	Detroit	MI	-83.043	42.346
M2574B	Wolverine Packing Co.	Detroit	MI	-83.041	42.346
M2574C	Wolverine Packing Company	Detroit	MI	-83.043	42.348
M2574D	Wolverine Packing Company	Detroit	MI	-83.043	42.358
M2575	E123 Enterprises, LLC	Bronx	NY	-73.872	40.807
M2576	Pepe's Operating, LLC	Chicago	IL	-87.66	41.861
M2581	Imperial Farms	Sumerduck	VA	-77.705	38.459
M2583	Contentnea Farms, LLC	Walstonburg	NC	-77.723	35.56
M2585	Link Snacks, Inc.	New Glarus	WI	-89.628	42.821
M2588	Byler's Custom Meats	Clarkson	KY	-86.106	37.386
M2591	Branding Iron Holdings - Holten Meat	Sauget	IL	-90.149	38.578
M2592	Byron Center Wholesale Meats, Inc.	Byron Center	MI	-85.725	42.813
M2595	David's Premium Beef LLC	N Little Rock	AR	-92.247	34.767
M2596	Alvios Cuban Meats, LLLP	Louisville	KY	-85.74	38.255
M2597	Arch Food Service Inc.	Wheeling	IL	-87.925	42.11
M2598	Hudson Meat Company	Columbus	OH	-82.988	39.914
M259B	Pikalo Foods, LLC	New Haven	CT	-72.912	41.308
M2600	Rode's Meats, LLC	Delphos	OH	-84.318	40.853
M2601	Martinous Produce Company Inc.	Pittsburg	KS	-94.741	37.443
M2609	T & J MEAT PACKING, INC.	Glenwood	IL	-87.596	41.537
M2611	Arveybell Farm Co.	Middlesboro	KY	-83.714	36.62
M2612	J. W. TREUTH & SONS, INC.	Catonsville	MD	-76.776	39.272
M2614	Jordan's Meat Market	Marcus	IA	-95.796	42.809
M2615	Chandler Foods, Inc.	Greensboro	NC	-79.838	36.056
M2617	Gold Creek Foods, LLC	Gainesville	GA	-83.818	34.268
M2619	The Wright Direction, LLC	Nephi	UT	-111.815	39.711
M262	National Beef Packing Co., LLC	Dodge City	KS	-99.986	37.748
M2624	Howdysnax	Bushnell	FL	-82.12	28.668
M2625	Punahele Jerky Company, Inc.	Hilo	HI	-155.06	19.703
M2628	Green River Meats LLC	Campbellsville	KY	-85.409	37.319
M2629	Hobson Foods Service	Nashville	TN	-86.893	36.18
M263	Jones Dairy Farm	Fort Atkinson	WI	-88.846	42.92
M2635	Unidos Meat Processors LLC	Hidalgo	TX	-98.26	26.127
M263A	Jones Dairy Farm	Fort Atkinson	WI	-88.85	42.916
M2640	Moin Halal Meat, LLC	Harrisburg	PA	-76.89	40.284
M2643	Latin Bites Factory LLC	Doral	FL	-80.342	25.797
M2644	Chef Dad Pot Pies	Baltimore	MD	-76.593	39.307
M2645	Homegrown Lg OK	Locust Grove	OK	-95.197	36.22
M2647	Keystone Catering, LLC	Kinzers	PA	-76.047	40.012
M2648	Big Country Beef Jerky	Nolanville	TX	-97.608	31.075
M265	RALPH & PAUL ADAMS, INC.	BRIDGEVILLE	DE	-75.606	38.742
M2651	Icebox Pantry, LLC	Hallandale Beach	FL	-80.146	25.989
M2652	Meacham Hams, Inc.	Sturgis	KY	-87.946	37.586
M2656	Ace & Ida Incorporated	Ord	NE	-98.946	41.625
M2660	Saucefly Basecamp	Eugene	OR	-123.161	44.045
M2664	Northwest Arkansas Food Bank	Lowell	AR	-94.127	36.274
M2666	Binkert's Meat Products, LLC	Baltimore	MD	-76.483	39.341
M2669	Merindorf Meats Inc	Mason	MI	-84.435	42.524
M267	JBS Tolleson Inc.	Tolleson	AZ	-112.254	33.442
M2670	New Kingsport Provision Company, Inc.	Kingsport	TN	-82.553	36.542
M2671	United Foods International (USA) Inc.	Phoenix	AZ	-112.203	33.441
M2673	Heartquist Hollow Farm, LLC	Dudleyville	AZ	-110.739	32.92
M2676	Southeast Poultry, Inc.	Rogers	AR	-94.147	36.352
M2677	StarHarvest Co. LLC	Yreka	CA	-122.595	41.734
M2678	Malcolms Meat Service Inc	Bristol	VA	-82.202	36.604
M268	True West Beef LLC	Jerome	ID	-114.43	42.742
M2680	John L Etzler, Inc.	Troutville	VA	-79.953	37.456
M2683	Flour Child Baked Goods, LLC	Midland	TX	-102.078	31.998
M2690	Flock Foods, LLC	Santa Fe Springs	CA	-118.052	33.94
M2693	Callahan Meats, Inc.	Barnesville	MN	-96.534	46.659
M2696	Cuatro Cinco Manufacturing	Houston	TX	-95.404	29.837
M2697	Buckhead Beef	College park	GA	-84.46	33.633
M2698	Smoky Mountain Meats	Newville	PA	-77.378	40.241
M26A	JBS Prepared Foods - Booneville	Booneville	MS	-88.556	34.669
M26C	JBS Prepared Foods	Council Bluffs	IA	-95.895	41.244
M27	Creekstone Farms Premium Beef LLC	Arkansas City	KS	-97.047	37.105
M2702	Pizzacini CORP	Miami	FL	-80.241	25.795
M2703	Pyramid Trading LLC	Newnan	GA	-84.862	33.425
M2705	United Meat Products, Inc.	Bellport	NY	-72.947	40.799
M2706	Cup and Char Pepperoni, Inc.	Buffalo	NY	-78.812	42.877
M2708	QbarS Custom Meats	Laketown	UT	-111.293	41.848
M2710	Jireh Enterprises LLC	Neosho	MO	-94.416	36.932
M2713	J. Rago Veal Co.	Boston	MA	-71.067	42.331
M2717	Atlanta Community Food Bank	East Point	GA	-84.495	33.663
M2718	Shawarma Al Basha, LLC	Miami	FL	-80.202	25.766
M272	T. F. Kinnealey Co., Inc.	Brockton	MA	-71.066	42.051
M2720A	Schuster Meat Corp	Lodi	NJ	-74.076	40.884
M27216	Great American Trucking- Select Foods	Delray Beach	FL	-80.092	26.45
M27219	North State Provision	Ahoskie	NC	-76.984	36.288
M27221	Standard Meat Company	Dallas	TX	-96.913	32.696
M27226	Second Harvest Food Bank of Middle Tennessee, Inc.	Nashville	TN	-86.794	36.199
M2723	Joey D's Chicago Style Eatery & Pizzeria	Venice	FL	-82.442	27.109
M27236	Sunnyside Meats, Inc.	Durango	CO	-107.881	37.111
M27237	Gore's Processing, Inc.	Edinburg	VA	-78.62	38.803
M27240	Old Hickory Smokehouse	Lewisburg	TN	-86.866	35.453
M2725	Croquetas La Mary LLC	Pembroke Park	FL	-80.169	25.995
M27252	Gahr's Hamloaf, LLC	Franklin	PA	-79.853	41.401
M27256A	Carlie C. McLamb Meats	Dunn	NC	-78.622	35.319
M27257	Central KY Custom Meats, Inc.	Liberty	KY	-85.061	37.372
M2726	Lo Fuk Yuen By Dim Sum Shop, Inc.	Brooklyn	NY	-73.999	40.617
M27260	Jancorp, LLC	Rantoul	IL	-88.16	40.303
M27263	Mr. Mudbug, Inc.	Kenner	LA	-90.27	30.0
M27266	West Central Turkeys LLC	Pelican Rapids	MN	-96.086	46.578
M27268	Maui Cattle Company, LLC	Kahului	HI	-156.474	20.887
M27268A	Maui Cattle Company, LLC	Puunene	HI	-156.453	20.853
M2727	Home Market Foods, Inc.	Norwood	MA	-71.19	42.169
M27273A	Felbro Culinary Specialties	Compton	CA	-118.226	33.879
M27274	P&S Bakery, Inc	Youngstown	OH	-80.704	41.126
M27277	Noxwell International, Inc.	Chamblee	GA	-84.294	33.894
M27288	DuBonilha Sausage Company	Newark	NJ	-74.172	40.746
M27289	Los Cidrines.	Arecibo	PR	-66.745	18.459
M27291	Urumex, LLC	Norcross	GA	-84.198	33.913
M27293	Miiller's Llano Smokehouse and Mercantile	Llano	TX	-98.684	30.76
M27295	D-S Smith Grinding Division Inc	North Salt Lake City	UT	-111.912	40.855
M27296	Bum Foods LLC	Birmingham	AL	-86.765	33.569
M27297	Campo Lindo Farms	Lathrop	MO	-94.368	39.509
M27298	E.M.S.A. Inc.	Lincoln	NE	-96.691	40.875
M273	The Spotted Trotter. LLC	Atlanta	GA	-84.35	33.747
M27300	West Coast Meats Inc.	Newman	CA	-120.979	37.291
M27302	San Francisco Soup Company	Oakland	CA	-122.241	37.781
M2731	Bruno Beef Strips	Monroe	WI	-89.623	42.599
M27316	Good Food Concepts, LLC	Colorado Springs	CO	-104.742	38.838
M2732	The Cut Meat Market	Sanborn	IA	-95.64	43.184
M27326	Ramarc Foods, Inc.	Chicago	IL	-87.645	41.812
M27333	Nestle Prepared Foods Company	Jonesboro	AR	-90.581	35.82
M2734	El Porteno Inc.	Oakland	CA	-122.24	37.786
M27342	Melotte Distributing, Inc.	Green Bay	WI	-87.991	44.509
M27349	Toluca Mexican Style Food Products, LLC	Baltimore	MD	-76.622	39.291
M2735	Ninos Fine Foods inc.	San Francisco	CA	-122.391	37.723
M2736	P&S Ravioli	Philadelphia	PA	-75.189	39.928
M27361	Reliable Brothers	Green Island	NY	-73.692	42.756
M27372	Truzzolino Tamales	Butte	MT	-112.513	45.995
M27373	The Classic Jerky Company	Taylor	MI	-83.247	42.262
M27379	Altura LLC	Anchorage	AK	-149.869	61.182
M2738	NHM Packing LLC	Florence	TX	-97.893	30.817
M27381	IHOM INC	Dallas	TX	-96.894	32.897
M27383	Paloma Mexican Foods Corporation	Santa Fe Springs	CA	-118.043	33.917
M27384	Smithfield Packaged Meats Corp.	Sioux Center	IA	-96.171	43.093
M27388	Second Bite Foods Inc	Shakopee	MN	-93.466	44.793
M27389	Pitman Farms	Sanger	CA	-119.552	36.693
M27398	Berkshire Refrigerated Warehousing LLC	Chicago	IL	-87.659	41.811
M27409	Artisan Bread Co., LLC	Warren	MI	-83.076	42.478
M27412	CSC FOOD MANUFACTURING, LLC	Graham	NC	-79.391	36.059
M27418	Granna's LLC	Bessie	OK	-98.988	35.389
M27424	Crider, Inc.	Stillmore	GA	-82.214	32.429
M27426	Fischer's Meat Market, Inc.	Muenster	TX	-97.376	33.651
M27426B	Fischer's Production Center	Muenster	TX	-97.375	33.651
M2743	Maria Empanada Commissary	Broomfield	CO	-105.1	39.905
M27434	Jim's Meat Market of Iron River LLC	Iron River	WI	-91.404	46.569
M27435	The Cut Custom Processing, LLC	Rosebush	MI	-84.773	43.684
M27440	Valley Beef, Inc.	Wendell	ID	-114.71	42.773
M27440A	Valley Beef, Inc.	Wendell	ID	-114.696	42.762
M27446	Ajinomoto Health & Nutrition North America	Akron	OH	-81.488	41.096
M2745	Freshway Foods	London	KY	-84.012	37.148
M27462	BRK Meats, LLC	Carthage	TX	-94.36	32.159
M27462B	BRK Meats, LLC	Tenaha	TX	-94.262	31.936
M27466	King's Pasties	Lead	SD	-103.753	44.356
M27467	A.J.'s Lena Maid Meats, Inc.	Lena	IL	-89.829	42.381
M27468	Buckhead Meat and Seafood of Central Florida	Auburndale	FL	-81.778	28.072
M2747	Mouth  of the South Charcuterie	Pawleys Island	SC	-79.099	33.484
M27472	Noah's Ark Processors, LLC	Hastings	NE	-98.395	40.564
M2748	Quaker Maid Meats Inc.	Reading	PA	-75.929	40.315
M27483	EME LLC	Mundelein	IL	-87.99	42.251
M27486A	Curly's Custom Meats	Jackson Center	OH	-84.049	40.44
M27488	Mekong Fresh Meats, Inc.	Mosinee	WI	-89.668	44.743
M27488A	Mekong Fresh Meats, Inc.	Mosinee	WI	-89.669	44.788
M2748A	Quaker Maid Meats	Reading	PA	-75.925	40.314
M2749	Modern Market Wholesale, LLC	Orchard Park	NY	-78.788	42.788
M27490	Mi Ranchito Foods, Inc.	Bayard	NM	-108.134	32.759
M27493	Central Oregon Butcher Boys	Prineville	OR	-120.867	44.324
M27494	Abuelito Meat Inc.	Passaic	NJ	-74.116	40.864
M27497	Ready Pac Produce, Inc.	Irwindale	CA	-117.938	34.094
M27499	Wenneman Meat Company, Inc.	St. Libory	IL	-89.712	38.364
M27505	Gold Creek Processing, LLC	Dawsonville	GA	-84.107	34.424
M27505A	Gold Creek Processing, LLC	Gainesville	GA	-83.792	34.328
M2751	Westons Meat Cutting, DBA Matthew Weston	West Gardiner	ME	-69.892	44.242
M27510	ATM International USA Inc.	Torrance	CA	-118.343	33.816
M2754	El Rey Chorizo LLC	Somerville	TX	-96.551	30.395
M2756	Fresh Creative Cuisine	baltimore	MD	-76.539	39.27
M276	AdvancePierre Foods, Inc.	Portland	ME	-70.278	43.645
M2760	Wisconsin River Meats	Mauston	WI	-89.941	43.834
M2761A	Berry Veal Corp.	Boynton Beach	FL	-80.088	26.49
M2763	Resaca Meat Processing LLC	Resaca	GA	-84.892	34.624
M2764	Corsentino Meat Processing, LLC	Walsenburg	CO	-104.718	37.656
M2767	Lone Crow Meat Processing LLC	Connell	WA	-118.862	46.661
M2767B	Lone Crow Meat Processing LLC	Eltopia	WA	-119.022	46.481
M2769	Omaha Beef Company Inc.	Danbury	CT	-73.452	41.398
M276A	AdvancePierre Foods, Inc	Portland	ME	-70.304	43.707
M2770	Wagner Provision Co., Inc.	Gibbstown	NJ	-75.276	39.826
M2771	Doña Tina	Irvine	CA	-117.847	33.681
M2772	S & A Sausage Co., Inc.	Reading	PA	-75.919	40.34
M2774	Siebert Premium Meats	Colby	KS	-101.054	39.467
M2776	European Food Market, LLC	Narrowsburg	NY	-74.925	41.592
M2778	Along Came Tamale	Fate	TX	-96.381	32.942
M278	Tyson Fresh Meats, Inc.	Holcomb	KS	-101.024	38.0
M2780	MAI'S Foods, LLC	Sorento	IL	-89.513	39.005
M2781	Borgofino Corp	Bartlett	IL	-88.266	42.004
M2782	Odenthal Meats Inc.	New Prague	MN	-93.628	44.486
M2784	Epic Food Bites, LLC	Norristown	PA	-75.344	40.114
M2785	Markwell Beef	Lawrenceburg	KY	-85.044	37.985
M2786	Southeast Alabama Meat Processing	Newton	AL	-85.646	31.247
M2788	Brocks Butcher Block	Sparta	WI	-90.841	44.108
M279	Link Snacks, Inc.	Alpena	SD	-98.367	44.181
M2793	5 Pillars Meat LLC	Farmville	VA	-78.411	37.264
M2794	Chop Chop Inc	Federal Way	WA	-122.314	47.302
M2795	Fioma Farm L.L.C.	Rosharon	TX	-95.464	29.348
M2796	Lamoy Meat Market Corp.	Brooklyn	NY	-74.005	40.652
M2799	Fidemart Food LLC	Tampa	FL	-82.489	27.957
M279A	LSI, Inc.	Alpena	SD	-98.37	44.187
M28	Smithfield Packaged Meats Corp.	Cudahy	WI	-87.864	42.954
M2800	Superior Farms	Dixon	CA	-121.822	38.417
M2801	PNW Veg Co LLC	Salem	OR	-122.957	45.055
M2802	Magong Food LLC	Monterey Park	CA	-118.151	34.053
M2803	Golden California Meat Packer Inc.	Fresno	CA	-119.848	36.786
M2809	Angelina Foods	Stockton	CA	-121.271	37.961
M2813	IF Co-Pack, LLC DBA Initiative Foods LLC	Sanger	CA	-119.549	36.69
M2813A	IF Co-Pack, LLC DBA Initiative Foods	Sanger	CA	-119.549	36.69
M2815	Whitleyville Station Meat Processing	Whitleyville	TN	-85.672	36.446
M2818	Watson Farms Meat Processing and Market LLc	Council Hill	OK	-95.75	35.521
M2821	Real Cajun Market	Woodbury	GA	-84.597	32.981
M2825	Blue Mountain Meats, Inc.	Monticello	UT	-109.339	37.868
M2826	Just In Thyme Foods	Memphis	TN	-89.849	35.191
M2827	Shamrock Locker LLC	O'Neill	NE	-98.647	42.453
M2829	Good Chaan	SANTA CLARA	CA	-121.982	37.372
M2834	NO BULL Prime Meats Production Facility	Albuquerque	NM	-106.59	35.145
M2836	Yoshinoya America, Inc.	Torrance	CA	-118.293	33.855
M2839	Cherokee Locker Inc.	Cherokee	IA	-95.551	42.731
M2840A	Golden Gate Wine Country Meats	Santa Rosa	CA	-122.714	38.427
M2840B	Golden Gate Meat Company	Richmond	CA	-122.362	37.922
M2841	Pier Fish Co., Inc.	New Bedford	MA	-70.923	41.643
M2842	Pimax	Berkeley	CA	-122.287	37.854
M2843	Renegades Meat Processing LLC	Webb	AL	-85.286	31.228
M2846	Far West Meats	San Bernadino	CA	-117.256	34.121
M2847	Revival Gourmet Foods, LLC	Downingtown	PA	-75.693	40.005
M2851	Reser's Fine Foods, Inc.	Hillsboro	OR	-122.911	45.565
M2852	Sara Sausage	Palmer Lake	CO	-104.906	39.126
M2853	Cattaneo Bros, Inc.	San Luis Obispo	CA	-120.653	35.267
M2855	Co-Man of GA Foods	Cumming	GA	-84.11	34.228
M2856	Jaren's Jerky	Enid	OK	-97.896	36.418
M2861	Safety Fresh Foods, LLC.	Glendale	WI	-87.916	43.096
M2862A	Oberto Snacks Inc.	Kent	WA	-122.268	47.4
M2862B	Oberto Snacks Inc.	Kent	WA	-122.283	47.388
M2862C	Oberto Snacks Inc.	Kent	WA	-122.268	47.4
M2865	Oscar's Meats	Ogden	UT	-111.983	41.209
M2866	Knockout Butchery	Roebuck	SC	-81.917	34.762
M2867	Portesi Italian Foods Inc.	Stevens Point	WI	-89.514	44.505
M2868	7 Mile Processing and Cattle Co. LLC	Minco	OK	-97.942	35.305
M287	Gaspar's Sausage Co., Inc.	N. Dartmouth	MA	-70.992	41.665
M2872	Newport Meat Northern California, Inc.	Fremont	CA	-121.916	37.465
M2873	Ngo Big LLC	Hayward	CA	-122.124	37.647
M2874	Allen Brothers, LLC	Richmond	CA	-122.374	37.926
M2875	Sabor Brasil, LLC	Windsor Locks	CT	-72.626	41.918
M2877	Haros Food Distribution, Inc.	Oxnard	CA	-119.163	34.189
M2879	Pearson Foods Corporation	Grand Rapids	MI	-85.64	42.907
M2881	Champion Foods, LLC	Gaffney	SC	-81.691	35.078
M2888	Demes Gourmet Corporation	Fullerton	CA	-117.89	33.873
M2891	Dolores Canning Co., Inc.	Los Angeles	CA	-118.176	34.049
M2896	Daniel Western Meat Packers Inc.	Pico Rivera	CA	-118.096	34.003
M2901	Bernatello's Pizza, Inc.	Maple Lake	MN	-94.014	45.234
M2902	Cougle Commission Company	Chicago	IL	-87.666	41.843
M2904	Spring Grove Foods Inc.	Miamisburg	OH	-84.287	39.638
M2908	Quick Pick Express	Oakland	CA	-122.308	37.816
M2910	Superior Foods Company	Kentwood	MI	-85.569	42.886
M2910A	Superior Foods Company	Kentwood	MI	-85.559	42.877
M2915	Nay's Meats Inc.	Panguitch	UT	-112.438	37.861
M2916	Nick's Meats & Grocery, Inc.	Hayward	MN	-93.245	43.65
M2918	Parker County Beef Company Processing	Springtown	TX	-97.644	32.944
M2920	Perdido River Meats LLC	Atmore	AL	-87.533	31.088
M2923	BR Bites LLC	Wixom	MI	-83.518	42.525
M2925	Family Farms, LLC	Eau Claire	WI	-91.527	44.779
M2926	Pork King Packing, Inc.	Marengo	IL	-88.617	42.201
M2928	American Jerky Company LLC	Ontario	CA	-117.6	34.04
M2929	Western Smokehouse	Greentop	MO	-92.564	40.354
M293	Cedar Creek Beef Jerky L.L.C.	El dorado Springs	MO	-94.005	37.854
M2930	Piekutowski Sausage, LLC	St Louis	MO	-90.207	38.664
M2932	Gotham Gourmet Provisions LLC	East Hanover	NJ	-74.4	40.803
M2933	Syracuse Food Group, LLC	Ponder	TX	-97.288	33.188
M2934	Star Packing Co., Inc.	St Louis	MO	-90.229	38.652
M2938	Woods Smoked Meats, Inc.	Bowling Green	MO	-91.21	39.348
M2940	Rhino Meat Processing LLC	Esmond	ND	-99.763	48.034
M2941	Planit Eats, Inc.	Fairhaven	MA	-70.897	41.646
M2942	Roncadin Inc.	Vernon Hills	IL	-87.956	42.23
M2944	Fajoli & Fajoli Service LLC	Deerfield Beach	FL	-80.126	26.317
M2945	EL FIRULETE EMPANADAS LLC.	Waukegan	IL	-87.846	42.356
M2949	Frick's Quality Meats	Washington	MO	-91.055	38.571
M2950	Appalachian Producers Cooperative	Telford	TN	-82.555	36.26
M2951	SMGP Holdings, LLC	Macon	GA	-83.7	32.869
M2956	Nadler's Meats & Catering LLC	Wellington	MO	-93.999	39.133
M2957B	Surlean Meat Company	San Antonio	TX	-98.514	29.413
M2958	El Rey Meat Company	St. Louis	MO	-90.226	38.698
M296	Smithfield Packaged Meats Corp.	Cincinnati	OH	-84.457	39.285
M2960	Soul Brothers Meats, LLC	North Wales	PA	-75.277	40.216
M2961	Midwest Farm Fresh Halal Meats	Hector	MN	-94.897	44.767
M2962	Mrs. Gerry's Kitchen	Albert Lea	MN	-93.348	43.675
M2963	West North Ventures dba QRISPERS	Minnetonka	MN	-93.418	44.951
M2966	National Beef Packing Food Service	Kansas City	KS	-94.617	39.085
M2967	Kuna Food Service	Dupo	IL	-90.194	38.524
M2968	AG Masterpiece	Los Angeles	CA	-118.206	34.067
M2969	Swiss Processing Plant Inc.	Hermann	MO	-91.47	38.562
M2972	Northeast Regional Corrections Center	Saginaw	MN	-92.33	46.917
M2974	Metabolic Meals, LLC	St. Louis	MO	-90.285	38.479
M2975	Meadville Locker LLC	Chillcothe	MO	-93.55	39.787
M2976	Bare Bones Butchering, LLC	Friendship	NY	-78.147	42.251
M2980	LG Foods LLC	El Paso	TX	-106.197	31.68
M2985	Elstner Meat Processing LLC	Weimar	TX	-96.81	29.703
M2990	St. Croix Meats, LLC	Chicago	IL	-87.714	41.797
M2991	De Leon Foods	Spokane Valley	WA	-117.195	47.656
M2995A	Matador Butcher Shop, LLC	Palmyra	MO	-91.518	39.802
M2996	AL-DEZ General Dist	Palm Springs	FL	-80.109	26.618
M2AD	ConAgra Brands, Inc.	Fort Madison	IA	-91.437	40.576
M2FR	ConAgra Product Development Lab	Omaha	NE	-95.926	41.255
M2WM	Fairmont Foods, Inc.	Fairmont	MN	-94.45	43.657
M3	Smithfield Packaged Meats Corp.	St Charles	IL	-88.275	41.916
M3006	Corn Maiden Foods	Baldwin Park	CA	-117.975	34.104
M3007	HOFC, LLC	Sherwood	OR	-122.831	45.364
M3008	Chicharrones Imperio LLC	Commerce City	CO	-104.909	39.826
M3009	Los Altos Poultry Inc.	Paramount	CA	-118.186	33.891
M301	Yosemite Valley Beef Packing Co., Inc.	Merced	CA	-120.471	37.186
M3012	Burkhart Meat Processing LLC	Kinsley	KS	-99.423	37.92
M3013	El Aguila Foods, Inc.	Montclair	CA	-117.703	34.061
M3017	Janus Food Group, Inc.	Northumberland	PA	-76.82	40.901
M3019	Whitsons Food Service (Bronx), LLC.	Berkeley	IL	-87.899	41.89
M3024	Papis Cuban Grill Commissary	Atlanta	GA	-84.266	33.886
M3026	D & S Meats Inc.	Mokena	IL	-87.861	41.544
M3029	Productos Nieves	San Antonio	PR	-67.087	18.493
M3030	Cook Out - Cotton Grove Inc.	Lexington	NC	-80.26	35.785
M304	Fred Usinger, Inc.	Milwaukee	WI	-87.914	43.043
M3040	Food Ranch Farms	Orangeville	UT	-111.047	39.231
M3041	Greenridge Naturals, Inc	Elk Grove Village	IL	-87.951	41.998
M3043	Daisy River Processing LLC	Camanche	IA	-90.258	41.799
M3044	Kenco Foods, LLC	Bath	PA	-75.393	40.727
M3048	Padovani LLC	Los Angeles	CA	-118.344	34.033
M3049	El Cazo Foods LLC	Riverside	CA	-117.486	33.919
M304A	Fred Usinger, Inc.	Milwaukee	WI	-87.908	43.026
M3050	KettleWorks, LLC	Neffsville	PA	-76.241	40.056
M3054	Happy Day Restaurants	Lewiston	ID	-117.005	46.398
M3054A	Mystic Cafe	Lewiston	ID	-117.015	46.419
M3054B	Happy Day Meats	Lewiston	ID	-117.005	46.398
M3055	Kramlich-Deede Meats, LLC	Medina	ND	-99.301	46.895
M3056	Americold Logistics, LLC	Wallula	WA	-118.918	46.14
M3057	DeTraglia Farms, LLC	Mechanicsburg	PA	-76.913	40.163
M3059	Smoking Pig LLC	Lodi	OH	-82.004	41.04
M3065	Alif Meat Packing, LLC	Lehighton	PA	-75.731	40.827
M3067	The Meat Schoppe, LLC	Lancaster	WI	-90.71	42.849
M3068	Sunset Farms LLC	Gilmer	TX	-94.791	32.664
M3069	Hang's Gourmet Inc	Tomball	TX	-95.633	30.097
M3071	Lot 279, LLC	Norfolk	NE	-97.413	42.011
M3075	Hanford Quality Meats LLC	Tracy	CA	-121.429	37.768
M3076	Kingdom Farms	Chicago	IL	-87.685	41.885
M3077	Sal Vitales and Sons Pizza Factory LLC	Muscatine	IA	-91.045	41.422
M30775	Rose Meat Services	Vernon	CA	-118.197	34.001
M30778	Rosemead processing Meats, Inc.	Los Angeles	CA	-118.254	34.025
M3078	Fair Oaks Foods, LLC	Davenport	IA	-90.616	41.611
M3080	Plainview Processing, LLC	Peabody	KS	-97.107	38.175
M3082	Wholesale Produce Supply, LLC	Minneapolis	MN	-93.217	44.992
M30833	Vazquez Foods Inc.	Commerce	CA	-118.131	34.001
M3085	Village Protein, Inc.	Monroe	WA	-122.003	47.868
M3088	Chefsolutions Manufacturing LLC	Orlando	FL	-81.274	28.467
M309	Garden Fresh Beef Jerky, Inc.	Garden Grove	CA	-117.946	33.774
M3091	Rockdale Locker, LLC	Maquoketa	IA	-90.65	42.061
M3092	Mac's Cajun Company	St. Amant	LA	-90.802	30.221
M30959	Emuna Inc	Hawthorne	CA	-118.334	33.914
M3096	Supreme Dumplings	Redmond	WA	-122.137	47.683
M3097	Café Rio Inc.	West Valley City	UT	-111.984	40.721
M3098	Earth Life Foods LLC	INDIANAPOLIS	IN	-85.954	39.773
M31	Fresh Mark Massillon	Massillon	OH	-81.499	40.784
M3115	Gangnam Gourmet Food LLC	Chicago	IL	-87.662	41.89
M3117	Sauls Fish Market	Astor	FL	-81.525	29.168
M3120	E.W. Grobbels Sons, Inc.	Taylor	MI	-83.298	42.25
M3129	Capital Management HPP, Inc.	Bartow	FL	-81.86	27.895
M3133	Georgia Packing Co., LLC	Americus	GA	-84.196	32.116
M3133B	Georgia Packing LLC	Columbus	GA	-84.946	32.453
M3134	Fresh Acre Foods	Gainesville	GA	-83.763	34.253
M3135	All In Meat LLC	Groveland	FL	-81.805	28.568
M31350	Shinsegae Foods, Inc.	Salem	OR	-123.004	44.989
M31351	AmeriCold Logistics	Cedar Rapids	IA	-91.636	41.93
M31354	Grand Prairie Foods, Inc.	Sioux Falls	SD	-96.691	43.563
M31354N	Grand Prairie Foods, Inc.	Sioux Falls	SD	-96.749	43.567
M3136	Americold Logistics LLC	Fairmont	MN	-94.439	43.66
M3138	Naugle's Custom Butchering and Deer Processing	Hunlock Creek	PA	-76.088	41.29
M314	Nocona Meat Company	Nocona	TX	-97.742	33.79
M3145	World of Pies LLC	Norcross	GA	-84.21	33.936
M3151	Centrillium Holdings LLC	Midwest City	OK	-97.402	35.508
M31532	Tonali's Meats, LLC	Denver	CO	-104.931	39.771
M31536	A La Carte Foods Properties, LLC.	Belle Rose	LA	-91.092	30.042
M31541	Alexandra Foods, LLC	Chicago	IL	-87.767	41.941
M31552	Smithfield Distribution, LLC	Crete	NE	-96.958	40.624
M31561	Maple Ridge Meats LLC	Benson	VT	-73.312	43.676
M31566	Monogram Gourmet Foods	Willmington	MA	-71.164	42.601
M31566A	Monogram Foods	Wilmington	MA	-71.161	42.6
M31575	Munsey Meats	Morristown	TN	-83.313	36.258
M31578	Trenton Processing	Trenton	IL	-89.684	38.605
M31586	Village Green Foods	Irvine	CA	-117.85	33.694
M31587	Saigon Eggrolls LTD	Houston	TX	-95.588	29.689
M31592	Streb Meats, Inc.	Dalton	OH	-81.692	40.796
M31593	Green Bay Dressed Beef, LLC	Green Bay	WI	-88.013	44.528
M31605	America's Best Steak	Bogue	KS	-99.69	39.36
M31606	Brock's Esto Meat Processing	Bonifay	FL	-85.646	30.978
M31624	Kerry Ingredients & Flavours Inc.	Vesper	WI	-89.966	44.484
M31636	Dobber's Pasties, Inc.	Escanaba	MI	-87.078	45.756
M31638	Chicharrones J&J	Santa Ana	CA	-117.852	33.743
M31639	Mountain Meadow Productions	Los Angeles	CA	-118.244	34.015
M31647	Theurers Custom Meat Inc	Lewiston	UT	-111.878	41.976
M3165	Red Rock Foods	Braselton	GA	-83.785	34.096
M31652	On On Food Company	Oakland	CA	-122.255	37.795
M31654	Burrito Kitchens Enterprises	Longmont	CO	-105.042	40.164
M31663	US Foods, Inc.	Lexington	NC	-80.326	35.777
M3167	A TU GUSTO LLC	Lehigh Acres	FL	-81.597	26.62
M31679	South Florida Foods International, Inc.	Miami	FL	-80.356	25.828
M31681	Ankeny Cold Storage, LLC	Ankeny	IA	-93.594	41.716
M31690	Quality Refrigerated Services, Inc.	Spencer	IA	-95.149	43.16
M31697	TKMM, LLC	Portland	OR	-122.579	45.546
M31699	S&F Foods Inc.	Romulus	MI	-83.33	42.26
M31725	Nana's Kitchen, Inc	Johnsburg	IL	-88.222	42.37
M31725H	Nana's Kitchen, Inc.	Huntley	IL	-88.418	42.169
M31727	Kiryas Joel Poultry Processing Plant	Monroe	NY	-74.159	41.336
M3173	Paleovalley, LLC	Mesa	AZ	-111.729	33.447
M31731	Herd Packing Company LLC	Springfield	IL	-89.639	39.843
M31744	Skoglund Meats and Locker, Inc.	West Bend	IA	-94.442	42.961
M31747	Salumi Artisan Cured Meats, LLC	Kent	WA	-122.245	47.435
M3175	True Pack, LLC.	Evansville	IN	-87.545	38.006
M31750A	Nuovo Pasta Productions, Ltd.	Stratford	CT	-73.155	41.169
M31750B	Nuovo Pasta Productions, Ltd.	Stratford	CT	-73.155	41.165
M31757	Buckhead Meat of Denver	Aurora	CO	-104.798	39.761
M3176	Texas Asian Food Manufacturing Corporation	Houston	TX	-95.654	29.702
M31763	Land Mark Products Inc.	Milford	IA	-95.173	43.328
M31764	The Global Gourmet, LLC	Shamokin	PA	-76.58	40.832
M31771	FlexXray, LLC	Arlington	TX	-97.079	32.683
M31772	Lone Star Bakery, Inc.	China Grove	TX	-98.33	29.383
M31776	Eickman's Processing Co., Inc.	Seward	IL	-89.357	42.235
M31777	Burgundy Pasture Meats LLC	Grandview	TX	-97.186	32.276
M31778	The Kreuz Sausage and Barbecue Co., Inc.	Lockhart	TX	-97.672	29.89
M31780	A & S Distributors	Salida	CA	-121.085	37.709
M31784	John Soules Foods, Inc.	Gainesville	GA	-83.834	34.276
M31786	Very Tasty LLC	Miami	FL	-80.236	25.797
M31787	BAFS, Inc.	Bangor	ME	-68.807	44.811
M31793	Lineage Logistics LLC	Mount Pleasant	IA	-91.522	40.972
M31795	Halal Meat Slaughter House	Norwood	NC	-80.202	35.221
M31797	La Quercia Operating LLC	Norwalk	IA	-93.685	41.465
M31805	JBS USA	Olympia	WA	-122.781	47.079
M31806	Enslin & Son Packing Company	Hattiesburg	MS	-89.309	31.364
M3181	Parish Meat Processing LLC	Sibley	LA	-93.292	32.569
M31812	Crider, Inc.	Stillmore	GA	-82.214	32.429
M31816	Schad Meats Inc.	Cincinnati	OH	-84.545	39.133
M3182	Farmstead Meats, LLC	Honey Brook	PA	-75.874	40.088
M31820	His Meat Company, LLC	Rudolph	WI	-89.806	44.496
M31820A	His Meat Company	Rudolph	WI	-89.804	44.496
M31824	Bloomfield Food, Inc.	Anaheim	CA	-117.815	33.864
M31826	Wild Zora Foods, LLC	Loveland	CO	-105.056	40.403
M31827	Pel'Meni Inc.	Ferndale	WA	-122.586	48.845
M31834	California Sausage Inc.	Santa Ana	CA	-117.897	33.743
M31843	State Farm Meat Plant	State Farm	VA	-77.831	37.641
M31860	Georgia Department of Corrections	Milledgeville	GA	-83.195	33.01
M31865	Paradise Locker Meats	Trimble	MO	-94.568	39.475
M31866M	Woodson County Prime Meats Pro	Yates Center	KS	-95.741	37.882
M31870	Embutidos El Compay	Coamo	PR	-66.343	18.081
M31877	Twin Rivers Foods	Atkins	AR	-92.931	35.241
M31879	Lawry's Wholesale, Inc.	Marquette	MI	-87.435	46.549
M31884	Pritzlaff Wholesale Meats, LLC	New Berlin	WI	-88.125	42.997
M31888	Gold Star Chili, Inc	Cincinnati	OH	-84.42	39.113
M31896	Universal Pure Cold Storage, LLC & Universal Pure, LLC	Lincoln	NE	-96.699	40.769
M31896AR	Universal Pure Holdings, LLC	Arlington	TX	-97.068	32.746
M31896B	Universal Pure West	Mira Loma	CA	-117.521	34.027
M31896C	Universal Pure, LLC	Meriden	CT	-72.816	41.541
M31896D	Universal Pure, LLC	Delphos	OH	-84.319	40.855
M31896M	Universal Pure, LLC	Malvern	PA	-75.557	40.067
M31896VR	UPC Southeast, LLC	Villa Rica	GA	-84.941	33.748
M31898	Kensington Lockers Inc.	Kensington	KS	-99.034	39.771
M31899	Perdue Foods, LLC	Salisbury	MD	-75.589	38.399
M3190	Americold Logistics LLC	Fremont	NE	-96.489	41.421
M31903	Gold Kosher Catering	N. Miami Beach	FL	-80.18	25.955
M31907	Diverse Food Products, LLC	Baldwinsville	NY	-76.303	43.169
M31910	Bella Bella Gourmet Foods, LLC	West Haven	CT	-72.982	41.29
M31911	King Cheese Corporation	Monrovia	CA	-117.997	34.134
M31911A	King Cheese Corporation	Upland	CA	-117.692	34.103
M31912	Traverse Bay Pizza Company	Orleans	MI	-85.087	43.075
M31915	MERRILL DISTRIBUTING, INC.	Wausaukee	WI	-87.95	45.369
M3192	Colorado Prefare Foods, LLC	Denver	CO	-104.857	39.784
M31932	Certified Meat Products	Fresno	CA	-119.747	36.698
M31932A	Certified Meat Products	Fresno	CA	-119.748	36.702
M31935	Flying Food Group, LLC	Miami	FL	-80.311	25.79
M31943B	CTI Foods Texas Soups, LLC	Saginaw	TX	-97.355	32.853
M3195	Sunbow Distributing	Orem	UT	-111.683	40.269
M31959	Lebanese Butcher Slaughter House Inc	Warrenton	VA	-77.805	38.714
M31960	Humphrey's Market, Inc.	Springfield	IL	-89.636	39.782
M31965	Triumph Foods LLC	St Joseph	MO	-94.876	39.719
M31971	D&M Packing	Albemarle	NC	-80.21	35.337
M31979	Gold Creek Processing LLC	Gainesville	GA	-83.827	34.274
M31980	M & C Unico, Inc.	Los Angeles	CA	-118.235	33.976
M31988	Strassburger Meats, LLC	Carlstadt	NJ	-74.079	40.833
M3199	Red Kingfisher, LLC	Olathe	KS	-94.82	38.826
M31993	Garland Ventures LTD	Garland	TX	-96.674	32.913
M31996	Kaiser Foodline LLC	Garland	TX	-96.687	32.896
M31996B	Kaiser Foodline, LLC	Houston	TX	-95.64	29.706
M31999	Thompson Farms Country Cured Meats	Dixie	GA	-83.701	30.761
M31999A	Thompson Farms	Dixie	GA	-83.701	30.761
M320	Mariah Foods	Columbus	IN	-85.91	39.199
M32004	American Pasteurization Company	Milwaukee	WI	-88.052	43.071
M32006	Frozen Assets Cold Storage LLC	Chicago	IL	-87.683	41.844
M32007	Walnut Valley Packing LLC	El Dorado	KS	-96.848	37.81
M32009	Salm Partners, LLC	Denmark	WI	-87.834	44.356
M3201	Maestri d'Italia Inc.	Vineland	NJ	-75.055	39.521
M32015	Troll Smokehouse	Kawkawlin	MI	-83.95	43.667
M32016	CPK Quality Foods	Blaine	MN	-93.23	45.135
M32019	San Miguel	Modesto	CA	-120.992	37.606
M32026	Raw Seafoods, Inc.	Fall River	MA	-71.11	41.74
M32027	Monogram Prepared Meats, LLC	Harlan	IA	-95.333	41.626
M32029	Kiolbassa Provision Company Inc.	San Antonio	TX	-98.516	29.413
M32029A	Kiolbassa Provision Company	San Antonio	TX	-98.511	29.41
M3203	Criolite Corporation	Las Piedras	PR	-65.872	18.179
M32031	K-D Market Inc.	New York	NY	-73.999	40.717
M32036	El Corral Meats	Salt Lake City	UT	-111.94	40.759
M32038	By George, Inc.	Trujillo Alto	PR	-65.988	18.374
M32042	Brushy Prairie Packing, Inc.	LaGrange	IN	-85.268	41.647
M32046	New World Services, Inc.	Matthews	NC	-80.696	35.118
M32049	Ron's Home Style Foods	Houston	TX	-95.481	29.64
M32053	Fresh Grill LLC	Santa Ana	CA	-117.865	33.708
M32053A	Richandre, Inc.	Carson	CA	-118.252	33.878
M32056	Lao Khitsada Food, Inc.	Whittier	CA	-118.066	33.969
M3206	Arctic Fresh Seafood	New Bedford	MA	-70.915	41.625
M32062	Washington County Meat Packing	Bristol	VA	-82.213	36.65
M32064	LA PASTA INC	Silver Spring	MD	-77.058	39.002
M32076	Los Olivos, Ltd.	Farmingdale	NY	-73.428	40.725
M32081	Salad Time, LLC	Jackson	GA	-84.048	33.215
M32084	Northern Lakes Seafd & Mts LLC	Detroit	MI	-83.058	42.41
M32085	ASU Food Safety and Product Development Lab	San Angelo	TX	-100.513	31.544
M32095	Wassler Meats, Inc	Cincinnati	OH	-84.625	39.163
M320M	Smithfield Fresh Meats Corp.	Milan	MO	-93.118	40.22
M32101	G. C. Enterprises, LLC	Leary	GA	-84.516	31.486
M32107	Gourmet Boutique LLC	Phoenix	AZ	-112.107	33.445
M32113	Down Home Meats, Inc	Stonewall	LA	-93.821	32.283
M32119	Blackhawk Specialty Foods	Beaver Falls	PA	-80.391	40.768
M3212	Cuttinup Custom Meat Processing, LLC	Leeton	MO	-93.707	38.62
M32120	Green Mountain Smokehouse, Inc	Windsor	VT	-72.392	43.469
M32123	Custom Culinary, Inc	Avon	OH	-82.006	41.476
M32130	Dakota Provisions LLC	Huron	SD	-98.159	44.367
M32131	Rey Chavez Distributor Corp.	Miami	FL	-80.252	25.83
M32133	Biloxi Beach Group LLC #2	Pelahatchie	MS	-89.816	32.401
M32134	Bridgford Meat Company	Statesville	NC	-80.782	35.75
M32138	HTE Food Corp.	College Point	NY	-73.839	40.784
M32141	Lo Yumhmie Foods, LLC	Appleton	WI	-88.419	44.273
M32148	Bak Foods	Atlanta	GA	-84.546	33.754
M32150	The Craft Cannery	Bergen	NY	-77.941	43.071
M32153	Opportunities, Inc. of Jefferson County	Fort Atkinson	WI	-88.832	42.939
M32153A	Opportunities, Inc.	Oconomowoc	WI	-88.478	43.075
M32154	Rico Brand Inc.	Salt Lake City	UT	-111.918	40.768
M32154R	Rico Brand Inc.	Salt Lake City	UT	-111.918	40.768
M32158	The Royal Butcher	Braintree	VT	-72.689	43.932
M32161	Guymon Extracts, Inc	Guymon	OK	-101.451	36.711
M32166	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Itasca	IL	-88.047	41.989
M3217	Member's Cut	Sioux Center	IA	-96.173	43.089
M32170	Ganaderos Borges	Naguabo	PR	-65.742	18.212
M32184	Johnson's Premium Sausage	Elmira	NY	-76.802	42.075
M3219	Colorado Premium Cold Storage	Denver	CO	-104.966	39.79
M322	Double J Meat Packing, Inc.	Pierce	CO	-104.763	40.635
M3221	Homestyle Direct	Lewisburg	TN	-86.758	35.427
M3226	Waguespack Food Company	Milam	TX	-93.808	31.524
M32298	Farmhouse Meat Company	Carthage	IL	-91.134	40.414
M322A	Pilgrim's Pride Corporation	Cold Spring	MN	-94.406	45.462
M3230	Sargento Cheese Inc.	Hilbert	WI	-88.163	44.133
M3235	TexSan Butchers	Lytle	TX	-98.796	29.219
M3236	LALM, LLC	Buffalo	NY	-78.831	42.885
M3239	Del Sur Reading	Reading	MA	-71.103	42.522
M323A	Beech-Nut Nutrition Corporation	Amsterdam	NY	-74.228	42.941
M3243	WFN Foods LLC	San Antonio	TX	-98.427	29.323
M3246	KDM Group, LLC	Rosedale	MD	-76.5	39.329
M325	Clausen Meat Company Inc.	Turlock	CA	-120.84	37.456
M3250	Robert Rust Foods	Winston-Salem	NC	-80.221	36.072
M32511	Harvester Meat Co.	Canton	IL	-90.028	40.597
M3252	Joe's Commissary, LLC	San Francisco	CA	-122.388	37.757
M3253	Politis Specialty Foods LLC	Deerfield Beach	FL	-80.125	26.313
M3254	Cedar Valley Services	Austin	MN	-92.98	43.689
M3255	Dr. Packing	Dallas	TX	-96.89	32.898
M3256	Link Snacks, Inc.	Perry	GA	-83.766	32.487
M3258	Hoja Foods	Sacramento	CA	-121.504	38.65
M3259	Fish Food	Minneapolis	MN	-93.263	44.935
M3265	Heritage Meats, Inc.	Leoti	KS	-101.354	38.482
M3267	Global Food Services, Inc.	Tampa	FL	-82.42	27.966
M3270	Oh Brother Philly NJ	Pennsauken	NJ	-75.074	39.94
M3272	Wilfoods, LLC	Henderson	NC	-78.41	36.319
M3276	New England Charcuterie, LLC	Waltham	MA	-71.2	42.385
M3278	Calbassa	Glendale	CA	-118.285	34.164
M3282	SK Food Group, Inc.	McDonald	TN	-84.967	35.139
M3290	Cozy Corner Cooking	Rutledge	MO	-91.994	40.253
M3293	E.W. Grobbel Sons, Inc.	St. Clair Shores	MI	-82.908	42.474
M3294	Mainville Farm Market	Bloomsburg	PA	-76.374	40.975
M3298	AM Food Manufacturing & Distribution, LLC	Meriden	CT	-72.765	41.502
M33	Performance Food Group	Taunton	MA	-71.137	41.944
M3300	Basim Halal Cattle LLC	Rosenberg	TX	-95.967	29.601
M3301	Little Brown Bird LLC	Pennsauken	NJ	-75.077	39.93
M3304	KC Chorizo Co. - Food Truck Central	Kansas City	KS	-94.608	39.101
M3313	DelGrosso Foods - Kristel Lane	Altoona	PA	-78.331	40.568
M3314	Makana Provisons Meat Co Corp.	Honolulu	HI	-157.8	21.294
M332	FPL Food LLC	Augusta	GA	-81.979	33.447
M3320	TDX Protein Solutions	Canton	MO	-91.545	40.123
M3323	Schuman Cheese	Fall Creek	WI	-91.261	44.765
M3324	Shamrock Meat Processing LLC	Snyder	NE	-96.783	41.706
M3326	Americold Logistics, LLC	Jefferson	WI	-88.812	42.99
M3328	Vondel Foods LLC	Atlanta	GA	-84.266	33.886
M332R	FPL Food LLC	Thomasville	GA	-84.005	30.846
M332T	FPL Food, LLC	Thomasville	GA	-84.005	30.842
M3330	El Maguey Dorado Corporation	Hialeah	FL	-80.286	25.844
M3331	1481 Meats Inc.	Upham	ND	-100.732	48.589
M3332	Simi Xest Sqeltc Sukaxni ni A Kulak of Selis Qlispe and Ksanka, Inc.	Ronan	MT	-114.118	47.529
M3337	STEWIE'S CAJUN FOODS LLC	Battle Creek	MI	-85.183	42.261
M3340	Founders Meat Co.LLC	Tucker	GA	-84.239	33.839
M3343	SoupWerks	Ontario	CA	-117.568	34.049
M3345	Great Lakes Meat Processing LLC	Homer	MI	-84.866	42.12
M3346	GoOats, LLC	Alexandria	VA	-77.137	38.803
M3348	Chow Teo Food Company	Los Angeles	CA	-118.219	34.079
M3349	Harvest Station Foods, LLC	Loudon	TN	-84.414	35.713
M335	Riley's Jerky	Greenville	CA	-120.928	40.136
M3352	JX Foods LLC	Las Vegas	NV	-115.185	36.075
M3353	Straka Meats inc.	Plain	WI	-90.046	43.279
M3354	Bear Paw Meats, LLC	Chinook	MT	-109.22	48.586
M3357	Himalayan Dumplings	Minneapolis	MN	-93.229	44.949
M3360	Omaha Halal Live Market, Inc.	Omaha	NE	-95.951	41.21
M3362	Thoughtful Snacks LLC	Pleasanton	TX	-98.424	28.997
M3364	Gold Buckle Meats	Fairdealing	MO	-90.742	36.654
M3367	Arctic Cold Storage	St Cloud	MN	-94.156	45.498
M3369	Diamond Foods	Glen Burnie	MD	-76.63	39.158
M337	STX Beef Company, LLC	Corpus Christi	TX	-97.539	27.822
M3372	Que Arepas Factory LLC	Greenville	SC	-82.324	34.839
M3375	Panna Manufacturing LLC	Miami Gardens	FL	-80.218	25.922
M3377	Vodes Preparedness LLC	Dalbo	MN	-93.409	45.658
M33788	Siberoni	Portland	OR	-122.529	45.501
M33789	United Premium Foods, LLC	Woodbridge	NJ	-74.276	40.543
M33812	Halperns' Purveyors of Steak and Seafood	Atlanta	GA	-84.529	33.626
M33814	Buffalo SAV, Inc.	Buffalo	NY	-78.814	42.885
M33816	GICS Foods, LLC	Greenville	SC	-82.406	34.786
M33823	Hot Tamale Heaven	Greenville	MS	-91.058	33.408
M33824	Southern Snack Foods, Inc	Miami	FL	-80.197	25.945
M33829	Viva Burrito Development Corporation	Tucson	AZ	-110.958	32.214
M33832	Link Snacks, Inc	Laurens	IA	-94.847	42.849
M33840	Vicolo Wholesale	Hayward	CA	-122.052	37.61
M33842	Double L Ranch Inc.	Altamont	NY	-74.013	42.749
M33843	Eagle Bridge Custom Meat and Smokehouse	Eagle Bridge	NY	-73.392	42.961
M33850	Florida Meat Packaging, Inc.	Hialeah	FL	-80.333	25.896
M3386	Farmers Union Processing & Meats	Staples	MN	-94.811	46.376
M33860	W Diamond M Meats, LLC	Spring Hill	KS	-94.816	38.745
M33861	Standard Meat Company	Saginaw	TX	-97.354	32.855
M33863	Morty Pride Meats, Inc.	Fayetteville	NC	-78.861	35.047
M33866	Firmenich Incorporated	New Ulm	MN	-94.456	44.317
M33871	Ellengee Market Co	Chicago	IL	-87.766	41.973
M3388	Papa Nicho's Carne Seca	Edinburg	TX	-98.073	26.368
M33883	Original Fried Pies	Davis	OK	-97.141	34.399
M33884	Zarate Foods Inc.	Modesto	CA	-121.072	37.708
M33885	Chee Foo International Inc	Phoenix	AZ	-112.151	33.505
M33886	Tyson Bros., Inc.	Gastonia	NC	-81.138	35.279
M3389	Pizza By Pappas	Scranton	PA	-75.662	41.41
M33890	Wayne Farms LLC	Decatur	AL	-87.05	34.611
M33893	Fra' Mani, LLC	Berkeley	CA	-122.299	37.88
M3390	Golden Platter Foods, Inc.	Linden	NJ	-74.266	40.621
M33901	Case Farms, Processing	Farmerville	LA	-92.434	32.838
M33902	Wing Lee Farms	Chino	CA	-117.701	34.006
M33905	Sun Boricua	Camuy	PR	-66.844	18.379
M33907	Willy's Products	Lauder Hil	FL	-80.2	26.147
M3391	Milbor Meat Company LLC	Fairview	UT	-111.441	39.633
M33911	Ansaldos Sausage Corp.	Moorpark	CA	-118.893	34.282
M33915	Mickey Brown, Inc.	Houma	LA	-90.716	29.605
M33916	Loris Cold Storage and Retail	Loris	SC	-78.907	34.065
M33928	Lockwood Packing CO, LLC	Lockwood	MO	-93.959	37.388
M33928A	Lockwood Packing CO, LLC	Lockwood	MO	-93.963	37.39
M33936	Spray-Tek Inc.	Middlesex	NJ	-74.5	40.566
M33940	Fauquier's Finest Custom Meat Processing, Inc.	Bealeton	VA	-77.725	38.544
M33944	Stir Foods, LLC	Orange	CA	-117.865	33.814
M33948	Alwan & Sons Meats, Inc.	Peoria Heights	IL	-89.583	40.732
M33954	RHOSEY LLC   Rhosey, LLC	Brooklyn	NY	-73.973	40.612
M33957	Wholesome Products, LLC	Lemont	IL	-88.018	41.701
M33958	Halpern's Steak and Seafood Company LLC	WALTON	KY	-84.604	38.859
M33959	El Popular Sausage Factory, LLC	Valparaiso	IN	-87.017	41.458
M33960	Tyson Processing Services, Inc.	Bowling Green	KY	-86.29	37.037
M33961	D R Kiszka Inc	Linden	NJ	-74.236	40.646
M33967	Rajbhog Foods (NJ), Inc.	Jersey City	NJ	-74.062	40.72
M33971	McNees Meats and Wholesale LLC	North Branch	MI	-83.197	43.215
M33973	Cream Co. LLC	Oakland	CA	-122.209	37.759
M33975	Steuben Foods Inc.	Elma	NY	-78.629	42.802
M33976	Northstar Foods, Inc.	Elk Grove Village	IL	-87.943	41.989
M3398	Lineage Logistics, LLC	Grand Island	NE	-98.353	40.948
M33982	JBB Trading LLC	Houston	TX	-95.231	29.62
M33983	Smithfield Packaged Meats Corp	Sioux City	IA	-96.382	42.484
M33985	Kasia's Deli, Inc.	Chicago	IL	-87.685	41.89
M33987	Red Bowl Food Corporation	Brooklyn	NY	-74.015	40.63
M33989	StoneRidge Wholesale Division LLC	Wautoma	WI	-89.27	44.069
M33989A	Stone Ridge Wholesale Division LLC	Coloma	WI	-89.51	44.041
M33997	Roundy's Supermarkets, Inc.	Kenosha	WI	-87.874	42.591
M3400	Xinca Foods LLC	Arlington	WA	-122.149	48.169
M34001	Percival Packing L.L.C.	Scott City	KS	-100.916	38.483
M34008	Pasty Central LLC	Calumet	MI	-88.423	47.265
M34009	Washington Lamb Inc	Lorton	VA	-77.178	38.74
M3401	Jones Country Meats Inc	Climax	GA	-84.396	30.878
M34013	Taylor Farm - Pacific	Tracy	CA	-121.408	37.75
M34017	Orion Food Systems, LLC	Sioux Falls	SD	-96.765	43.574
M34026	Sunsof, Inc.	Hialeah	FL	-80.263	25.877
M34029	Global Gourmet Food Solutions LLC	Garland	TX	-96.69	32.902
M34037	Select Brands L.L.C.	Springfield	MO	-93.352	37.225
M34038	Sonia's Kitchen	Auburn	WA	-122.228	47.335
M3404	Hoseth Farms LLC	Loon Lake	WA	-117.604	48.06
M34049	B & K Meat	Decatur	GA	-84.239	33.78
M34052	Freightout.com, LLC	Moriarty	NM	-106.028	34.996
M34054	Fisher's Homestyle Salads LLC	Lancaster	PA	-76.214	40.064
M34056	Olsen Farms Meats	Chewelah	WA	-117.739	48.246
M34062	Teets Meat Packing, LLC	Elkins	WV	-79.819	38.95
M34064	QUALITY FOOD DISTRIBUTOR, INC.	LAS VEGAS	NV	-115.204	36.114
M34069	BHY  Foods Factory, LLC	El Monte	CA	-118.019	34.054
M34077	Roadrunner Home Bake, Inc.	Gladstone	OR	-122.602	45.388
M34078	Great Lakes Poultry, Inc.	La Porte	IN	-86.697	41.532
M34078A	Tri Eagle LLC	Kingsford Heights	IN	-86.698	41.487
M34092	JBS Prepared Foods-Tupelo Facility	Tupelo	MS	-88.773	34.253
M34095	A1 Meat Solutions, Inc.	El Monte	CA	-118.013	34.062
M3410	Farmhouse Five, LLC	Cedar City	UT	-113.132	37.738
M34103	Gentle Harvest	Winchester	VA	-78.137	39.286
M34107	American Food Services, LLC	Morganton	NC	-81.621	35.729
M34107A	American Food Service	Valdese	NC	-81.566	35.745
M34114	E. R. Boliantz Co. Inc.	Ashland	OH	-82.291	40.877
M34114A	E R Boliantz Company Inc.	Mansfield	OH	-82.531	40.774
M34117	Atlanta Meat Company, Inc.	Norcross	GA	-84.204	33.947
M34118	American Copackers Inc.	Alexandria	VA	-77.075	38.843
M34119	Apache Foods LLC	Canutillo	TX	-106.601	31.915
M34126	Latin Flavors Enterprise Inc.	Opa Locka	FL	-80.277	25.894
M34133	Royal Provisions, LLC	Dawson	MN	-96.024	44.924
M34135	Frenchy's Sausage Co., Inc.	Houston	TX	-95.45	29.841
M34138	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Carol Stream	IL	-88.109	41.923
M34140	Americold Logistics, LLC	Darien	WI	-88.731	42.592
M34142	The Perfect Pita, Inc.	Springfield	VA	-77.204	38.743
M34145	Kadejan, Inc.	Glenwood	MN	-95.372	45.656
M34148	Club House Market, Inc	Oklahoma City	OK	-97.53	35.462
M34151	George's Brand Meats, LLC	Franklin Park	IL	-87.906	41.945
M34153	Hooks Distribution USA, LLC	Bennettsville	SC	-79.641	34.624
M3416	FIT N PREP LLC	Groveland	FL	-81.805	28.569
M34167	Dakota Packing	Las Vegas	NV	-115.198	36.105
M34174	Pacific Coast Meat Inc.	San Francisco	CA	-122.401	37.777
M34176	Swift Beef Company	Lenoir	NC	-81.564	35.882
M34177	Sklenarik's Smoked Meats, Inc.	Miles	TX	-100.182	31.597
M34181	Hemingway Locker Plant LLC	Hemingway	SC	-79.447	33.752
M34182	Flushing Meat	Brooklyn	NY	-73.936	40.71
M34183A	USA Canning Food	Santa Ana	CA	-117.902	33.747
M34186	Tsim Neej Oriental	Fresno	CA	-119.737	36.743
M34194	Wang Jar Food, LLC	Downs	KS	-98.558	39.509
M34195	Gourmet Specialty Foods, LLC	North Andover	MA	-71.11	42.659
M34196	Hogs Galore FLP	Philipsburg	PA	-78.194	40.897
M34198	Don's Cold Storage & Transportation	Rogers	AR	-94.127	36.35
M3420	Legacy Meats Co	Verona	MO	-93.771	37.022
M34203	Cox Marketing	Midland	TX	-102.217	31.928
M34208	MEAT BAR INC.	JAMAICA	NY	-73.783	40.67
M3421	Boreas Freeze Dry LLC	Mount Vernon	MO	-93.828	37.087
M34216	Northwest Premier Meats, LLC	Tualatin	OR	-122.814	45.38
M34221	Glass Onion Catering	Richmond	CA	-122.372	37.93
M34224	Johnsonville, LLC	Sheboygan Falls	WI	-87.907	43.792
M34225	Johnsonville, LLC	Sheboygan Falls	WI	-87.908	43.794
M34227	S.D.J TRADING	Irvington	NJ	-74.249	40.72
M34241	Cortez Food Production	Salinas	CA	-121.631	36.649
M34243	T.G. Meat Center	East Bernard	TX	-96.064	29.532
M34250	Abeles & Heymann, LLC	Hillside	NJ	-74.235	40.709
M34257	Don Novo & Son	Miami	FL	-80.257	25.835
M3426	D'Empanadas	Brooklyn	NY	-73.952	40.643
M34265	Naturally New Mexico Food Products LLC	El Rito	NM	-106.19	36.337
M34271	Perthaiz, LLC	Hagerman	NM	-104.33	33.121
M34272	Vigil's Beef Jerky	Albuquerque	NM	-106.63	35.167
M34276A	Cabal sausage Co	Fredericksburg	VA	-77.441	38.379
M34283	Custom Meats of Marathon, Inc.	Marathon	WI	-89.843	44.922
M34284	Cruz Best Foods	Yigo	GU	144.885	13.528
M34290	Chef Minute Meals Inc	Piney Flats	TN	-82.28	36.436
M34293	Thrushwood Farms Quality Meats, Inc.	Galesburg	IL	-90.417	40.947
M34293A	Thrushwood Farms Quality Meats, Inc.	Galesburg	IL	-90.4	40.937
M34296	SON AND SONS TRADING CO. INC.	BROOKLYN	NY	-73.931	40.725
M34306	Athens Foods, Inc.	Cleveland	OH	-81.787	41.406
M34311	Paden Cold, Inc.	Norfolk	VA	-76.208	36.842
M34313	Columbus Manufacturing Inc.	Hayward	CA	-122.111	37.624
M34318	SFMV Newco, LLC	Tuscaloosa	AL	-87.551	33.181
M34327	Shin Provision, Inc.	Cicero	IL	-87.741	41.855
M34332	Commissary El Gallo, INC	Lodi	CA	-121.248	38.139
M34349	West Liberty Foods LLC	Tremonton	UT	-112.198	41.72
M34353	Vina Foods, DBA Vina Foods and Bakery	Boston	MA	-71.067	42.329
M34360	House of Halal Meat, Inc	Jasper	FL	-82.931	30.494
M3437	Rural Foods, LLC	Cambridge	NY	-73.382	43.034
M34371	Union Foods LLC	Rocky Mount	NC	-77.79	35.986
M34376	Spectrum Foods, Inc.	Landover	MD	-76.88	38.937
M34377	T & W Meat Company	Kingman	KS	-98.132	37.648
M3438	Pazcar Food Manufacturing and Trading Co, LLC	Spring	TX	-95.469	30.062
M34380	Mr. Empanada Inc.	Tampa	FL	-82.512	27.992
M34381	Crabill's Retail & Wholesale Meats, LLC	Toms Brook	VA	-78.403	38.943
M34384	Elkton Locker and Grocery, Inc.	Elkton	SD	-96.481	44.237
M34385	Productos Real	El Paso	TX	-106.318	31.728
M34388	European Meat Emporium	Fairfield	CT	-73.232	41.168
M34391	Sugar Valley Sausage Company	Gering	NE	-103.662	41.842
M34393	La Terra Fina USA, LLC	Union City	CA	-122.035	37.601
M34396	Patton's Sausage Company, Inc.	Bogalusa	LA	-89.873	30.694
M344	Elmwood Locker Service	Elmwood	IL	-89.966	40.777
M34401	Hunt's Meat Co.	Waterflow	NM	-108.452	36.76
M34403	Red Rock Beef Jerky	Gallup	NM	-108.748	35.527
M34406	Eagle Rock Food Co	Albuquerque	NM	-106.659	35.099
M34407	Mac's Meat Inc	Las Cruces	NM	-106.802	32.309
M34408	Delicious Beef Jerky	Albuquerque	NM	-106.638	35.158
M34412	Nextwave Food Solutions LLC	Albuquerque	NM	-106.668	35.063
M34414	Lakeside Meats	Carlsbad	NM	-104.226	32.419
M34415	Pronto Express 107	Gallup	NM	-108.79	35.513
M34420	Tullys Market & Deli	Albuquerque	NM	-106.587	35.092
M34429	Seoul Soondae Inc.	Los Angeles	CA	-118.281	33.915
M3443	GB Distribution Inc	Sacramento	CA	-121.339	38.668
M3444	Red Barn Butcher Shop	Fredonia	PA	-80.312	41.327
M34443	Dave's Seafood Meat & Poultry	Baltimore	MD	-76.654	39.285
M34447	Bar-S Foods	Seminole	OK	-96.661	35.261
M34448	Old World Meat	Duluth	MN	-92.135	46.801
M34449	Texas Natural Meats	Lott	TX	-97.114	31.121
M34450	Shakespeare's Pizza, Inc.	Columbia	MO	-92.337	38.906
M34459	Wordens Meat	Joplin	MO	-94.42	37.12
M3446	S&E Gourmet Cuts Inc.	Vernon	CA	-118.219	34.009
M34467	Shamrock Food Company	Commerce City	CO	-104.921	39.789
M3446A	S&E Gourmet Cuts Inc.	Vernon	CA	-118.22	34.007
M34473	Dogtown Pizza	St. Louis	MO	-90.229	38.653
M3448	Hebron Partners LLC DBA WOW Food	Margate	FL	-80.197	26.249
M34483	Mongiello Italian Cheese Specialties	Hurleyville	NY	-74.684	41.776
M34484	Azoria Food Productions, LLC	Phoenix	AZ	-112.01	33.406
M34485	Fontana Flavors, Inc.	Janesville	WI	-88.995	42.729
M34487	Bourgeois Smokehouse	Thibodaux	LA	-90.844	29.767
M34492	Fuji Food Products, Inc.	Santa Fe Springs	CA	-118.063	33.9
M34493	Salsas Locas	Portland	OR	-122.637	45.49
M34495	J.J. Foodservice Inc.	Vista	CA	-117.204	33.164
M345	Little Colorado Meats (Mobile Slaughter Unit)	Eagar	AZ	-109.234	34.1
M3450	Homestead Butchering	Richland	PA	-76.263	40.429
M34501	Valley Foods, Inc	Youngstown	OH	-80.645	41.096
M3451	Prewitt Farms Cattle & Meat Market	Doddridge	AR	-93.99	33.117
M34510	Fiori-Bruna Pasta Products	Hialeah	FL	-80.287	25.921
M34513	Taylor Farms New Jersey, Inc.	Swedesboro	NJ	-75.364	39.763
M34513A	Taylor Farms New Jersey, Inc.	Swedesboro	NJ	-75.366	39.765
M34524	A & A Finest	Corona	NY	-73.863	40.739
M3453	Tiny C Snacks, Inc.	Worcester	MA	-71.772	42.296
M34530	Signature Sauces	Independence	OH	-81.63	41.363
M34538	The Wornick Company dba Baxters North America, Inc.	Cincinnati	OH	-84.451	39.313
M34542	AZ Gourmet Foods Inc.	Philadelphia	PA	-75.128	40.019
M34543	Brewer Meats	North Vernon	IN	-85.676	38.923
M34546	Americold Mullica Hill	Mullica Hill	NJ	-75.256	39.722
M34554	Wilson Farm Meats, Inc.	Elkhorn	WI	-88.544	42.666
M34555	Lineage Logistics PFS, LLC	Jacksonville	FL	-81.687	30.333
M3456	Empire Importers and Distributors, Inc.	Danbury	CT	-73.446	41.394
M34560	Americold Logistics LLC.	Pedricktown	NJ	-75.411	39.74
M34565	South Superior Foods, Inc.	Superior	WI	-92.105	46.663
M34569	Ohio Farms Packing Co. Ltd.	Creston	OH	-81.918	40.984
M3457	Red Barn Meat Market LLC	Lamoni	IA	-93.896	40.624
M34577	A.T.A. Meat Company, Inc.	Lauderdale Lakes	FL	-80.184	26.16
M34581	Create A Pack Foods, Inc.	Ixonia	WI	-88.599	43.135
M34588	KIWI KUISINE	ALEXANDRIA	VA	-77.112	38.804
M34589	Country Fresh Meats, Inc.	Weston	WI	-89.501	44.89
M3459	Natural Soups, Inc.	Hormigueros	PR	-67.121	18.14
M34590	Chisesi Brothers Meat Packing Co.	New Orleans	LA	-90.182	29.951
M34591	Hastings Foods LLC	Grand Island	NE	-98.38	40.913
M34592	KTF Protein Solutions Inc.	Saint Marys	OH	-84.342	40.53
M34595	Fair Market Inc.	Montgomery City	MO	-91.494	38.96
M34598	Stanley's Market Brands LLC	Toledo	OH	-83.518	41.711
M345P	Little Colorado Meats (Processing)	Eagar	AZ	-109.34	34.107
M3460	Days Wholesale	Denham Springs	LA	-90.954	30.586
M34604	Taco Loco Products	Anchorage	AK	-149.894	61.173
M34606	Saugatuck Kitchens, LLC	Stratford	CT	-73.154	41.186
M34611	Fathead Peppers	North Wales	PA	-75.277	40.213
M34614	Stonie's Sausage Shop	Perryville	MO	-89.887	37.722
M34615	Latitude 36 Foods, LLC	Corona	CA	-117.521	33.827
M34627	Aztec Imperio	Bronx	NY	-73.897	40.822
M34635	A.B. Vannoy Hams	West Jefferson	NC	-81.493	36.396
M34641	CAFE SPICE LLC	NEW WINDSOR	NY	-74.062	41.489
M34641A	Cafe Spice, LLC	Beacon	NY	-73.947	41.517
M34643A	FiveStar Gourmet Foods	Rancho Cucamonga	CA	-117.581	34.078
M34644	Creminelli Operating LLC	Salt Lake City	UT	-112.005	40.776
M34647	La Montagne Holdings LLC	Chicago	IL	-87.686	41.935
M3465	Wilmot Productions	Chicago	IL	-87.734	41.931
M34650	Eclectic Foods, LLC d/b/a Dirt Road Gourmet	Eclectic	AL	-85.961	32.693
M34657	Rachael's Food Corporation	Chicopee	MA	-72.613	42.166
M34660	Tran Meat Corporation	Houston	TX	-95.553	29.846
M3467	Natural Harvest LLC	Spring Green	WI	-90.066	43.188
M34670	Keeter's Meat Company, LLC	Tulia	TX	-101.778	34.531
M34671	Industrial Logistics Group	Kansas City	KS	-94.609	39.122
M3467M	Prem Meats LLC	Spring Green	WI	-90.066	43.188
M3467P	Prem Meats LLC	Prairie du Sac	WI	-89.745	43.293
M34683	Tennery Propane, Inc. D/B/A Hardtimes Real Beef Jerky	El Reno	OK	-97.915	35.494
M34685	Harbor Place Corp.	Stanton	CA	-117.994	33.809
M34687	Northwoods Locker LLC	Clayton	WI	-92.211	45.354
M3469	Volare Food Group, Inc.	Vernon	CA	-118.199	34.003
M34692	Shaker Valley Foods, Inc	Cleveland	OH	-81.734	41.465
M34698	Dover Processing, Inc.	Dover	MN	-92.138	43.969
M347	Salumeria Oldani, LLC	St Louis	MO	-90.276	38.615
M3470	Shared Harvest Foodbank	Fairfield	OH	-84.516	39.328
M34703	Taylor Farms	Smyrna	TN	-86.502	35.999
M34706	Cargill Meat Solutions	Fresno	CA	-119.802	36.69
M34707	Taste of Italy	Egg Harbor City	NJ	-74.617	39.536
M34708	Ajinomoto Foods North America	Oakland	MS	-89.906	34.074
M34713	Innovative Foods, LLC	Evans	CO	-104.704	40.368
M34715	Patterson TMP Operating, LLC	Fort Worth	TX	-97.31	32.624
M3472	Cut Meat Creek Custom	Chancellor	SD	-96.98	43.459
M34722A	Harvest Food Group, LLC	East Chicago	IN	-87.474	41.623
M34729	White Oak Pastures	Bluffton	GA	-84.861	31.49
M3472A	Cut Meat Creek Custom LLC	Chancellor	SD	-96.98	43.459
M34732	Anichini Bros Inc	Chicago	IL	-87.634	41.892
M34733	Taylor Farms TX, Inc.	Dallas	TX	-96.895	32.752
M34734	Bonneville Meats	Roy	UT	-112.022	41.19
M34736	TFC Poultry, LLC	Ashby	MN	-95.816	46.093
M34738	Sam Butcher Shop	Ellis Grove	IL	-89.881	37.976
M3474	Americold Logistics	Benson	NC	-78.567	35.358
M34741	American Beef Packers, Inc.	Chino	CA	-117.701	34.005
M34744	Custom Made Meals Jacksonville Buyer, LLC	Jacksonville	FL	-81.659	30.472
M34746	Samthong Meat Market	Sacramento	CA	-121.468	38.513
M34754	Constance Food Group, DBA Norris Food Services, LLC	Bohemia	NY	-73.091	40.777
M34757	Tortellini & Co. Inc.	Davie	FL	-80.207	26.075
M34758	Chorizo Selecto	Holland	MI	-86.117	42.781
M34763	Rutger University Food Innovation Center	Bridgeton	NJ	-75.222	39.425
M34764	Spokane Produce, Inc.	Spokane	WA	-117.491	47.637
M34769	T & B Bailey dba Rayfield Meat Center	Wadesboro	NC	-80.122	34.922
M34771	The Sausage Kitchen	Lisbon Falls	ME	-70.06	43.998
M34774	Progressive Food Products	Tiffin	OH	-83.204	41.103
M34775	Western Meat Processors, Inc.	Mayaguez	PR	-67.151	18.207
M3479	All Hale Meats, LLC	Wolfforth	TX	-102.025	33.506
M34795	Summer Garden Food Manufacturing	Boardman	OH	-80.643	40.996
M34799	Braggs Corner Meat Corp.	Culpeper	VA	-77.96	38.483
M3480	Crustpz Corp.	Pittsfield	MA	-73.244	42.448
M34800	Hearty Acquisitions, LLC	Brooklyn	NY	-73.938	40.71
M34806	PurFoods, LLC	North Jackson	OH	-80.886	41.096
M34807	Elk County Processing & Provisions, Ltd.	Ridgway	PA	-78.769	41.467
M3481	Ryder Integrated Logistics, Inc.	Columbus	OH	-82.96	40.036
M34811A	Cured by Visconti	Wenatchee	WA	-120.324	47.442
M34816	USA Ham LLC	Hialeah	FL	-80.292	25.847
M34818	Gur-Meat Inc.	Garrochales	PR	-66.583	18.459
M34823	Pacific Coast Container	Seattle	WA	-122.352	47.586
M34825	RFS Cheese, LLC	Monroe	WI	-89.638	42.609
M34826	Alex Deli	Chicago	IL	-87.751	41.931
M34829	Nor-Am Cold Storage, Inc.	Detroit Lakes	MN	-95.839	46.818
M34832	Cured Foods LLC	Avondale Estates	GA	-84.273	33.776
M34834	Taylor Farms Northwest LLC	Kent	WA	-122.233	47.399
M34835	Smithfield Packaged Meats Corp.	Kansas City	MO	-94.673	39.285
M34837	Defiance 326, LLC	Sterling	CO	-103.327	40.711
M34840	Crispheart Produce, Inc.	Hudsonville	MI	-85.866	42.854
M3486B	Kandu Industries Inc	Milton	WI	-88.947	42.778
M349	Parker House Sausage Company	Chicago	IL	-87.626	41.811
M3492	C&J Catering	Middletown	PA	-76.763	40.22
M3493	Meat Planet Inc.	Houston	TX	-95.296	29.742
M3494	Yonker Brothers Processing LLC	Mason	TX	-99.222	30.741
M3496	Mountain View Meats and Custom Slaughter LLC	Star Tannery	VA	-78.418	39.119
M3497	TTT Meats +	Sunray	TX	-101.825	36.018
M3499	Smoking Art	Lexington	SC	-81.173	33.972
M35	Rantoul Foods LLC dba Agar Foods LLC	Rantoul	IL	-88.211	40.314
M3501	Pope Meat Company LLC	Lockney	TX	-101.445	34.116
M3502	DAC's Original LLC	Bennett	CO	-104.44	39.748
M3505	Dakota Gobblers, LLC	Huron	SD	-98.235	44.375
M3506	Tink's Tonic, LLC	Statesboro	GA	-81.819	32.394
M3508	Divine Mercy Farms	La Fayette	GA	-85.24	34.752
M3510	Hong Huong Food Inc.	Garden Grove	CA	-117.922	33.761
M3511	DEDEM HALAL MEAT WHOLESALE INC	Chicago	IL	-87.772	41.917
M3512	Noemi's Dumplings	Nantucket	MA	-70.085	41.267
M3518	Empirical Foods, Inc.	Garden City	KS	-100.829	37.958
M3521	Bass Farms, Inc.	Spring Hope	NC	-78.155	35.923
M3528	Saker Shoprite Kosher Commisary	Freehold	NJ	-74.24	40.252
M3532	AdvancePierre Foods, Inc.	Claremont	NC	-81.138	35.715
M3534	Romanian Kosher Meats LLC.	Chicago	IL	-87.675	42.013
M3536	Circle E Ranch	Yatesville	GA	-84.162	32.908
M354	Western Valley Meat Company	Fresno	CA	-119.801	36.689
M3541	Rancher's Choice Processing	Bellville	TX	-96.212	29.895
M3542	Pacific Agri - Products, Inc.	South San Francisco	CA	-122.391	37.657
M3547	Wald Family Foods LLC	Burlington	IA	-91.159	40.827
M3550	West River Meats LLC	Rutland	IA	-94.291	42.761
M3552	Stauffers Butcher Barn LLC	Mechanicsville	MD	-76.607	38.395
M3561	NW Dough LLC	Camas	WA	-122.371	45.586
M3562	Lineage Logistics, LLC	Lincoln	NE	-96.737	40.848
M3568	Domestikated Biscuits	Spokane	WA	-117.38	47.664
M3575	Carolina Pure Snacks	Pittsboro	NC	-79.171	35.719
M3577	Furnari Sausage Company	Redding	CA	-122.391	40.582
M3578	Midwest Food and Meat Distributors Inc.	Minnetonka	MN	-93.402	44.903
M3581	Laxson Provisions	New Braunfels	TX	-98.087	29.695
M3584	Lily of the Desert Nutraceuticals	Lewisville	TX	-96.973	33.014
M3585	The Deer Shop and Custom Cuts	Ringgold	GA	-85.078	34.881
M3586	The Meat Shop LLC	Clinton	TN	-84.202	36.123
M3587	The Pot Pie Bar	Goffstown	NH	-71.509	42.995
M3588	Bittner Craft Meats, Inc.	Chenoa	IL	-88.72	40.744
M3589	Uncle's Family Kitchen LLC	Dallas	TX	-96.879	32.835
M3591	Hometown Meat Market LLC	Scottsboro	AL	-86.042	34.667
M3592	Milwaukie Kitchen	Milwaukie	OR	-122.635	45.454
M3597	SULU ORGANICS LLC	WEST DUNDEE	IL	-88.348	42.107
M3598	Texas All Grass Fed LLC	Sealy	TX	-96.127	29.768
M3599	Traditional Snack, Inc	Miami	FL	-80.315	25.822
M3601	Grandmas Jerky	Milledgeville	GA	-83.274	33.158
M3602	Distribuidora De Embustido Antonio	Providence	RI	-71.445	41.819
M3603	Amazing Taste Foods, Inc.	North Little Rock	AR	-92.224	34.758
M3606	Umami Hottie, LLC	San Leandro	CA	-122.172	37.713
M3607	Azuma Foods International Inc., U.S.A	Hayward	CA	-122.135	37.655
M3612	Fatback Pig Project LLC	Birmingham	AL	-86.788	33.517
M3613	Windthorst Custom Meat Co	Windthorst	TX	-98.439	33.593
M3620	Puddin LLC	Capitol Heights	MD	-76.852	38.882
M3623	Durand Meat Processing	Durand	MI	-84.009	42.906
M3627	Venture Protein International	Jackson	TN	-88.813	35.62
M3628	Woodys Custom Cuts	Preston Park	PA	-75.372	41.887
M363	Verschoor Meats, Inc.	Sioux City	IA	-96.387	42.479
M3631	Momin Organic Meat LLC	Comer	GA	-83.179	34.112
M3632	Ya YA Foods USA LLC	Ogden	UT	-111.998	41.268
M3633	Garvin Family Butcher, LLC	Rising Sun	MD	-76.033	39.702
M3637	B&B Locker LLC	Wynot	NE	-97.17	42.738
M3638	Pegasus Jerky Company	Dallas	TX	-96.839	32.827
M3639	Nourish Markets Inc.	Wilmington	DE	-75.569	39.732
M3640	Whole Foods Market Connecticut Metro Kitchen	Wallingford	CT	-72.771	41.495
M3643	Loose Goose Kitchenworks	Canaan	NY	-73.429	42.377
M3644	Whole Foods Market Maryland Metro Kitchen	Upper Marlboro	MD	-76.725	38.871
M3645	Mayar Meat	Laton	CA	-119.777	36.466
M3646	Prairie Sky Processing	Miami	OK	-94.943	36.972
M3649	Go Time Foods LLC	North Salt Lake City	UT	-111.9	40.861
M3653	Western Smokehouse Partners Mexico, MO	Mexico	MO	-91.833	39.168
M3654	Max's Import's LLC	Sterling Heights	MI	-83.067	42.549
M3655	Savoonga Reindeer Commercial Company	Savoonga	AK	-170.494	63.691
M3660	Knidos Group Inc.	Sacramento	CA	-121.447	38.613
M3665	La Trafila, LLC	Brooklyn	NY	-73.995	40.668
M3666	Veselka Lorimer Commissary, LLC	Brooklyn	NY	-73.95	40.716
M3676	Berkshire View Custom Cut Meats, LLC	Hannacroix	NY	-73.912	42.437
M3683	North Star Bison, Slaughter Division	Conrath	WI	-91.008	45.381
M3685	Norakert INC	Sun Valley	CA	-118.371	34.23
M3691	Wow Bao LLC	Forest City	NC	-81.841	35.336
M3692	Northstar Bison LLC	Cameron	WI	-91.737	45.412
M3695	Foraged Melon LLC	Chicago	IL	-87.772	41.917
M3697	GroveFoods	Bethel	CT	-73.42	41.358
M3698	Carnes Zazueta LLC	Austin	TX	-97.72	30.213
M3699	Hydro Pressure & Pack LLC	Twinsburg	OH	-81.466	41.291
M3705	HM Halal Munchies Corp.	Syosset	NY	-73.516	40.802
M3709	Sunflame Foods LLC	Healdsburg	CA	-122.875	38.632
M3711	M3 Meats	Sidney	MT	-104.149	47.713
M3712	Bafang Yunji Foods LLC	Irvine	CA	-117.84	33.689
M3714	Cafe Don Julio LLC	Tampa	FL	-82.474	28.025
M3717	L. Di Pasquale & Sons	Baltimore	MD	-76.567	39.289
M3718	The Gilded Kitchen, Inc., DBA Gyoza Shop	Brooklyn	NY	-73.984	40.691
M3719	Latinos Meat Distributors	Houston	TX	-95.292	29.737
M372	Pioneer Packing Company, Inc.	Bowling Green	OH	-83.645	41.362
M3723	4475 Peachtree Lakes Drive Operating LLC	Duluth	GA	-84.183	33.976
M3727	Pinnacle Baking Inc.	Belton	TX	-97.49	31.053
M3730	Prairie Packing	Comanche	OK	-97.978	34.36
M3734	J&J Quality Meats LLC	Bourbon	IN	-86.077	41.296
M3741	Antojo Mix Inc.	Hoffman Estates	IL	-88.139	42.065
M3743	No BS Meats	Seattle	WA	-122.344	47.698
M3744	Gehl Foods Walterboro	Walterboro	SC	-80.663	32.999
M3745	East Coast Seafood, LLC	New Bedford	MA	-70.923	41.65
M3746	Little Village Frozen Pizza LLC	Bonduel	WI	-88.445	44.74
M3747	Pflug Packaging & Fulfillment	Elwood	IL	-88.135	41.406
M3749	Mika's Gourmet Food LLC dba Old Heidelberg	Fort Lauderdale	FL	-80.154	26.092
M3750	Ready Fresh Copackers LLC	Clinton Township	MI	-82.867	42.626
M3756	Aruba's Halal Kitchen	Philadelphia	PA	-75.066	40.009
M3762	World Meat Trade, Inc	Chantilly	VA	-77.471	38.912
M3764	Nit Noi Provisions	Norwalk	CT	-73.417	41.097
M3773	Alta Vista Locker LLC	Alta Vista	KS	-96.491	38.864
M3775	Foodture, LLC	Los Angeles	CA	-118.265	33.984
M3776	Stella D's Food LLC	Los Angeles	CA	-118.218	34.079
M3779	Quesitos	Atlanta	GA	-84.264	33.886
M3780	Hamilton Meats	Weatherfor	TX	-97.78	32.742
M379	Jimenez Mexican Foods Inc.	Perris	CA	-117.248	33.825
M3797	Home Style Foods, Inc	Hamtramck	MI	-83.045	42.401
M3800	Ohio Valley Meats LLC	Hanover	IN	-85.543	38.675
M3803	Stilson Abattoir LLC	Brooklet	GA	-81.557	32.372
M3804	Backstraps Deer Processing, LLC.	Lizella	GA	-83.837	32.814
M3807	Vinods Imports LLC	Sacramento	CA	-121.395	38.508
M3809	Chicago Prime Supply	Calumet City	IL	-87.528	41.623
M3815	Schmidt's Sausage Shop, LLC	Harrisburg	PA	-76.803	40.234
M3816	Aye Gourmet, LLC	Quarryville	PA	-76.068	39.924
M3817	Illinois BPT LLC	Arthur	IL	-88.472	39.717
M3818	Casa Crobu	Denver	CO	-104.931	39.68
M3819	BAYA BILTONG LLC	Fort Lauderdale	FL	-80.135	26.14
M3822	Dancing Badger Bodyworks	Alamosa	CO	-105.867	37.467
M3824	Maha Setthi, LLC	Sharon	PA	-80.505	41.234
M3825	Clark Fork Custom Meats	Plains	MT	-114.913	47.494
M3828	Philly's Best Steak Company, Inc.	Yeadon	PA	-75.261	39.935
M382F	Smithfield Packaged Meats Corp.	Grayson	KY	-82.93	38.348
M3831	MK Provisions, Inc.	Los Angeles	CA	-118.219	34.079
M3838	Cool Creations LLC	North Kansas City	MO	-94.583	39.129
M3843	Love Pizza LLC	Golden Valley	MN	-93.381	44.984
M38432	Los Pasteles de La Abuela	Guayama	PR	-66.182	17.952
M38435	Brand Aromatics Inc	Lakewood	NJ	-74.19	40.059
M38439	Walls Gourmet Foods LLC	Las Vegas	NV	-115.206	36.195
M38441	P&Z Fine Foods LLC	Paramount	CA	-118.175	33.885
M38447	BelGioioso Cheese, Inc.	Freedom	WI	-88.31	44.385
M38453	Pinn-Oak Ridge Farm LLC	Delavan	WI	-88.718	42.7
M38456	Yankee Trader Seafood LTD.	Pembroke	MA	-70.772	42.102
M38458	Charlie's Produce	Anchorage	AK	-149.879	61.135
M38463	La Indi Poultry	City of Industry	CA	-117.966	34.023
M38468	Colorado Premium Foods	Denver	CO	-104.966	39.79
M38474	United States Cold Storage - Wilmington	Wilmington	IL	-88.138	41.321
M38478	Pacific Produce Corporation	Tamuning	GU	144.81	13.502
M38479	B&O Island Style Chamorro Sausage	Tamuning	GU	144.788	13.495
M38487	Fine Foods of South Florida	Pembroke Park	FL	-80.167	25.987
M38493	Seven Nation Food Company	Mount Vernon	NY	-73.822	40.91
M38494	Emmaus Foods, LLC	Albertville	AL	-86.216	34.283
M38498	Brothers Meats Processors, LLC	Norcross	GA	-84.236	33.914
M385	Safer Plate	Eden Prairie	MN	-93.405	44.874
M3850	Seattle Samosa LLC	Redmond	WA	-122.094	47.665
M3851	IL Panino, Inc.	Hartford	CT	-72.657	41.748
M38511	New S.B.L., Inc.	Chicago	IL	-87.651	41.812
M38514	C & S Poultry	Monterey Park	CA	-118.148	34.055
M38521	Ornna Brazilian Sausage Corp.	Orlando	FL	-81.298	28.578
M38522	Metropolitan Foods	Wayne	NJ	-74.265	40.899
M38530	Greenridge Farm, Inc.	Elk Grove Village	IL	-87.946	42.004
M38532	HertaBerkSchwein Farms LLC	Groveland	FL	-81.902	28.545
M38548A	Che Pibe Gourmet Products	Miami	FL	-80.254	25.841
M38549	York Street Caterers Inc.	Englewood	NJ	-73.99	40.887
M38549A	YORK STREET CATERERS INC.	ENGLEWOOD	NJ	-73.989	40.888
M38550	Heritage Specialty Foods, LLC	Milwaukie	OR	-122.594	45.428
M38552	B&M Processing	Chatsworth	GA	-84.789	34.753
M38556	Heritage Meats	Rochester	WA	-123.079	46.822
M38560	Los 7 Hermanos Corporation	Houston	TX	-95.492	29.722
M38561	KJPL Restaurants, Inc.	Greene	ME	-70.142	44.192
M38564	Foreman's Boudin Kitchen	Dry Creek	LA	-93.046	30.671
M38565	Trader Gus, Inc.	Waunakee	WI	-89.415	43.151
M3857	Vuong Toan Enterprises	Garland	TX	-96.669	32.91
M386	Thomasville Cold Storage	Thomasville	GA	-83.99	30.855
M3862	Evergreen Refreshments	Spokane	WA	-117.253	47.677
M3864	Old Salt Co-op	Helena	MT	-111.989	46.6
M3868	Seventh Inc. DBA 3Hmong Sausage	St. Paul	MN	-93.151	44.959
M3870	Reser's Fine Foods, Inc.	Topeka	KS	-95.634	39.043
M3871	York Cold Storage Co	York	NE	-97.597	40.873
M3873	From Home LLC	Chantilly	VA	-77.428	38.905
M3874	Nectar of Armenia Inc.	GLENDALE	CA	-118.285	34.164
M3875	Signature Foods, USA, LLC	Easley	SC	-82.485	34.766
M3877	Legacy Beef LLC	Grangeville	ID	-116.133	45.935
M3879	Boston Sword and Tuna	Boston	MA	-71.029	42.348
M3886	M&S Meats	Kalispell	MT	-114.268	48.135
M3887	Golden Snacks LLC	Warrenton	VA	-77.683	38.744
M3891	Chuckies Beef Jerky	Del Rio	TX	-100.822	29.372
M3893	Economy Cash and Carry, Inc.	El Paso	TX	-106.323	31.703
M3897	PA Boys BBQ, LLC	Oxford	PA	-75.98	39.78
M390	Pilgrim's Pride Corporation	Greeley	CO	-104.855	40.412
M3900	Parrilleros Perros	Houston	TX	-95.494	29.98
M3914	DeMaiz Foods	Salt Lake	UT	-111.986	40.731
M3919	Del Monaco Superfoods LLC	Stockton	CA	-121.279	37.897
M3924	Mount Pleasant Beef Packing Co, LLC	Mount Pleasant	TX	-94.969	33.168
M3925	Jerky Company LLC	Albuquerque	NM	-106.607	35.134
M3927	Saltgrass Ranch I, LLC	Summerdale	AL	-87.676	30.472
M3931	LuBell Foods	Burnsville	MN	-93.26	44.784
M3933	Den Dumpling Co	Denver	CO	-104.991	39.69
M3934	LX Bar Meat Co LLC	Buffalo	WY	-106.665	44.354
M3938	Jhatka Farms LLC	Savoy	TX	-96.311	33.612
M3939	Coal Miner's Beef Jerky Co, LLC	Princeton	WV	-81.14	37.4
M394	Monogram Meat Snacks, LLC	Chandler	MN	-95.949	43.933
M3944	Wag's Brothers Meats, LLC	Wellsville	PA	-76.983	40.031
M3945	Hardwick Craft Meats, Inc.	Hardwick	MA	-72.247	42.316
M3948	Pflug Packaging	Cartersville	GA	-84.732	34.091
M394A	Branding Iron Holdings	Sauk Rapids	MN	-94.145	45.589
M3951	Kitchen of Dana	Cleveland	GA	-83.759	34.608
M3952	Colorado Cold Connect	Fort Morgan	CO	-103.771	40.249
M3953	Oak Valley Meat Processing & Abattoir	Toccoa	GA	-83.221	34.583
M3955	Seven Hills Food LLC	Buda	TX	-97.843	30.046
M3957	A & B Meat Processing	Comer	GA	-83.135	34.102
M3958	Mockingbird Food Group	Dallas	TX	-96.901	32.774
M3961	Clarkco Meats, LLC	Cochranville	PA	-75.91	39.91
M397	Tilghman Island Seafood LLC	Tilghman	MD	-76.333	38.719
M3973	O'guirre's Farm Inc.	Tuscumbia	AL	-87.737	34.617
M3975	Harmons Central Production Facility	West Valley	UT	-111.986	40.696
M3978	Wasatch Freeze Dry	West Jordon	UT	-111.992	40.601
M3981	Pearson Jerky Company LLC	Woodward	OK	-99.384	36.467
M3984	MONTEREY MOUNTAIN MEATS	MONTEREY	VA	-79.511	38.477
M39878	G&D Smokehouse and Mercantile	Yukon	OK	-97.735	35.504
M3988	Courage Production, LLC	Hayward	CA	-122.049	37.612
M39880	LSBBQ Wholesale, LLC	Bensalem	PA	-74.933	40.144
M39881	Virginia Packing LLC	Toano	VA	-76.806	37.411
M39886	AJ Pasties LLC	Anaconda	MT	-112.951	46.129
M39891	Biloxi Beach Group LLC #1	Morton	MS	-89.669	32.35
M39892	Fresh & Ready Foods LLC	San Fernando	CA	-118.419	34.29
M39895	Lioni Latticini, Inc.	Union	NJ	-74.254	40.675
M39896	The Fillo Factory	Northvale	NJ	-73.943	40.999
M39897	F&S Produce Co., Inc.	Vineland	NJ	-75.036	39.461
M39898	Bridor USA, Inc.	Bridgeport	CT	-73.163	41.172
M39904	Mountain View Packaging, LLC	Boise	ID	-116.191	43.571
M39913	Jacob Fleishman Cold Storage Inc.	Miami	FL	-80.217	25.85
M39924	BJ's Wholessale Club	Hialeah Gardens	FL	-80.328	25.861
M39927	Southeast Wholesale Foods	Medley	FL	-80.375	25.858
M39928	Olympia Provisions	Portland	OR	-122.664	45.521
M39932	JRC Culinary Group Inc.	Monterey Park	CA	-118.145	34.057
M39936	Vertical Cold Storage, LLC	Medley	FL	-80.368	25.874
M39940	Genco	Edwardsville	IL	-90.056	38.765
M39941	Casanova Market, Inc.	Hauppauge	NY	-73.259	40.814
M39942	Farview Farms Meat Company	Topeka	KS	-95.665	39.161
M39944	Prosperity Foodservice Group LLC	Doral	FL	-80.362	25.794
M39949	McCain Foods Snack Plant.	Plover	WI	-89.57	44.456
M39950	Achatz Handmade Pie Company LLC	Chesterfield	MI	-82.806	42.715
M39952	Emil's Pizza, Inc.	Watertown	WI	-88.714	43.173
M39957	Promo International, Inc.	Miami	FL	-80.38	25.884
M39961	Glenn's Market & Catering, Inc.	Watertown	WI	-88.733	43.196
M39961J	Grandpa Glenn's Pet Treats	Johnson Creek	WI	-88.779	43.088
M39963	Hellmann Worldwide Logistics	Miami	FL	-80.366	25.812
M39967	Thrive Life	American Fork	UT	-111.792	40.364
M39967A	Thrive Life	American Fork	UT	-111.787	40.345
M39968	Donald's Meat Processing, LLC	Lexington	VA	-79.43	37.781
M39973	Price Smart, Inc.	Miami	FL	-80.375	25.864
M39986	Honolulu Baking Company	Honolulu	HI	-157.857	21.297
M3999	Palisade City Meats & Processing	Henning	MN	-95.446	46.321
M39991	Quirch Foods	Miami	FL	-80.333	25.843
M39992	Dept of Veterans Affairs	Hampton	VA	-76.332	37.015
M39994	F&S Produce West LLC dba F&S Fresh Foods	Sacramento	CA	-121.396	38.476
M39994A	F&S Produce West LLC dba F&S Fresh Foods	Sacramento	CA	-121.394	38.476
M39998	My Bento & Catering	Honolulu	HI	-157.874	21.34
M39999	Rite Stuff Foods	Jerome	ID	-114.52	42.701
M3D	Swift Beef Company	Cactus	TX	-102.013	36.053
M3FW	Standard Meat Company	Fort Worth	TX	-97.34	32.787
M3JC	Smithfield Packaged Meats Corp.	Junction City	KS	-96.867	39.002
M3M	Smithfield Packaged Meats Corp.	St James	MN	-94.618	43.989
M3S	Swift Pork Company	Marshalltown	IA	-92.898	42.055
M3W	Swift Pork Company	Worthington	MN	-95.574	43.632
M400	Los Banos Abattoir Co., Inc.	Los Banos	CA	-120.874	37.058
M40000	Jasper Meats, Inc.	Bloomingdale	IL	-88.13	41.945
M40001	Brett Anthony Foods	Elk Grove Village	IL	-87.967	42.004
M40001A	D.A. Stein Culinary Group	Northbrook	IL	-87.827	42.112
M40017	Northern Culinary Brands, LLC	Plattsburgh	NY	-73.54	44.707
M40026	Hart Food Products Inc	Paramount	CA	-118.161	33.898
M40030	Panapastry, LLC.	Medley	FL	-80.344	25.863
M40031	ACC Central Kitchen LLC	Thorofare	NJ	-75.19	39.838
M40033	Chorizo Janitzio, Inc.	Bakersfield	CA	-119.069	35.438
M40041	Marksbury Farm Foods, LLC	Lancaster	KY	-84.666	37.699
M4005	Williamsburg Packing Company Inc.	Kingstree	SC	-79.815	33.683
M40056	Smoking Goose LLC	Indianapolis	IN	-86.138	39.773
M40057	Bemar Snacks Inc.	Medley	FL	-80.35	25.865
M40059	Legendary Meats, LLC	Marietta	GA	-84.539	33.977
M40062	Dong's Specialty Foods	Virginia Beach	VA	-76.099	36.797
M40074	L&R Fine Food, Inc.	Garden Grove	CA	-117.9	33.776
M40077	Interstate Caterers Inc.	South Plainfield	NJ	-74.432	40.578
M4008	Caribbean Food Delights	Tappan	NY	-73.944	41.032
M40088	Compass Group/Canteen	Middletown	PA	-76.792	40.224
M40092	Divine Pasta	Burbank	CA	-118.308	34.173
M4010	Euro Food, Inc., DBA Citterio USA Corporation	Freeland	PA	-75.899	41.011
M40103	Lineage Logistics, LLC	Centralia	WA	-122.999	46.761
M40106	Cherry Meat Company	Chapel Hill	TN	-86.668	35.628
M40108	Sullivan Provisions	Chicago	IL	-87.649	41.825
M4010A	Euro Foods Inc., d/b/a Citterio USA Corp	Freeland	PA	-75.896	41.012
M4011	High on the Hog Custom Meats	Dittmer	MO	-90.686	38.31
M40110	Collagen Solutions (US) LLC DBA Evergen	Glencoe	MN	-94.118	44.772
M40114	Gem Food Services Corp.	Rosenberg	TX	-95.782	29.563
M40117	Jerky Junction, Inc	Carson City	NV	-119.724	39.193
M40118	Nob Hill Pizza	San Mateo	CA	-122.312	37.555
M40119	CS Best Food, Inc.	Panarama City	CA	-118.451	34.228
M40131	Apollo Export Warehouse Inc.	Miami	FL	-80.324	25.837
M40135	Wow Specialty Cuts Corp.	Hialeah Garden	FL	-80.375	25.898
M40145	D & N Provisions	Boston	MA	-71.067	42.329
M40147	This Old Farm Meats and Processing	Colfax	IN	-86.686	40.194
M40157	Sylvester Quality Meats	Westfield	PA	-77.561	41.965
M40159	H & S Minit Mart LLC	Bardstown	KY	-85.396	37.783
M40161	Global Village Foods	Quechee	VT	-72.421	43.644
M40168	North Georgia Meat Company Inc.	Ellijay	GA	-84.575	34.699
M40170	LINK & CURE LLC	Chattanooga	TN	-85.304	35.035
M40171	L&D Market Inc.	East Boston	MA	-71.017	42.386
M4018	Hilltown Pork Inc.	Canaan	NY	-73.431	42.37
M40187	Americold Logistics, LLC	Lula	GA	-83.727	34.377
M4019	Salumeria Biellese Inc.	NYC	NY	-73.996	40.749
M40190	Vincent Giordano Corp.	Philadelphia	PA	-75.189	39.94
M40191	Goya Foods of Florida	Miami	FL	-80.413	25.795
M40193	AdvancePierre Foods, Inc.	Enid	OK	-97.805	36.418
M40194	Cook Out, Inc.	Kernersville	NC	-80.097	36.109
M4019A	Salumeria Biellese LLC	Hackensack	NJ	-74.046	40.886
M402	Cooking Acquisitions, LLC	Pennsauken	NJ	-75.077	39.928
M40200	America New York Ri Wang Food Group Co., Ltd.	Maspeth	NY	-73.909	40.721
M40200A	America New York Ri Wang Food Group Co., Ltd.	Bay Shore	NY	-73.269	40.765
M40201	Oriental Delight, LLC	Virginia Beach	VA	-76.184	36.885
M40203	LJ's Beef Jerky LLC	Sacramento	CA	-121.473	38.653
M40207	Appalachian Ag, LLC	Prestonsburg	KY	-82.866	37.65
M40211	Fresh Food Manufacturing Company	Freedom	PA	-80.15	40.678
M40216	Lilly's Gastronomia Italiana, Inc., DBA Lilly's Fresh Pasta	Everett	MA	-71.062	42.408
M40216A	Lilly's Gastronomia Italiana, Inc., DBA Lilly's Fresh Pasta	Boston	MA	-71.076	42.387
M40217	Happy Hog Meatery	Moscow	ID	-117.004	46.74
M40219	Flannery Beef	San Rafael	CA	-122.535	38.017
M4022	Dietrich's Country Meats	Krumsville	PA	-75.838	40.579
M40221	Prairie Harvest Ltd	Spearfish	SD	-103.875	44.503
M40226	Grupo Salvatex	Katy	TX	-95.731	29.834
M40228	Russian Style Ravioli Inc.	Roselle	NJ	-74.258	40.647
M40230	Uncle Peter L.L.C.	Orion Township	MI	-83.246	42.744
M40232	American Butchers, Inc.	Guaynabo	PR	-66.101	18.408
M40234	Lineage Logistics PFS, LLC	Medley	FL	-80.384	25.891
M40235	Weidner's Deli / Genuine Jerky Inc.	Youngsville	PA	-79.327	41.849
M40236	Mark's Custom Meats	Howard	PA	-77.557	40.998
M40238	Correctional Industries Food Factory	Airway Heights	WA	-117.577	47.654
M4024	The Pig Skin Boys LLC	Yazoo City	MS	-90.397	32.86
M40242	Mr. P's Jerky	Deland	FL	-81.281	29.059
M40243	Nunez Foods	Miami	FL	-80.257	25.837
M40244	Gray's & Danny's Investment, Inc.	Moore Haven	FL	-81.079	26.782
M4025	Hoffer's Ligonier Valley Packing Inc.	Ligonier	PA	-79.277	40.212
M40251	Food Kits LLC	Bradley Beach	NJ	-74.016	40.207
M40253	Downing Cattle Company, Inc.	Fountain Run	KY	-85.963	36.701
M40255	Fa Lu Cioli LLC	Union	NJ	-74.255	40.676
M40256	Century Oak Packing Company	Mount Angel	OR	-122.763	45.064
M40259	Two Brothers Pork Skins	Kannapolis	NC	-80.613	35.518
M40262	Blue Star Meat Corp.	Bronx	NY	-73.892	40.81
M40264	Rancher's US OP LLC	Vadnais Heights	MN	-93.052	45.071
M40268	Sinton and Sons Local Meats and Provisions	Paso Robles	CA	-120.69	35.651
M40268A	Sinton and Sons Local Meats and Provisions	Paso Robles	CA	-120.533	35.539
M40269	Boyd Specialties LLC	Colton	CA	-117.311	34.055
M4027	NPC Processing, LLC	Shelburne	VT	-73.214	44.406
M40270	Productos La Finca Inc.	Sabana Grande	PR	-66.959	18.07
M40280	Taylor Farms Southwest Inc.	Tolleson	AZ	-112.245	33.439
M40282	A Full Measure Catering	Advance	NC	-80.41	35.942
M4030	John's Ravioli Company Inc.	New Rochelle	NY	-73.79	40.902
M40300	TORRES PACKING , LLC	Virginia Beach	VA	-76.185	36.892
M40306	Atlas Meat Company	Fort Collins	CO	-105.002	40.587
M40310	Mary's Harvest Fresh Foods, Inc.	Portland	OR	-122.638	45.577
M40311	Mecca Halal Poultry	Astoria	NY	-73.929	40.755
M40312	La mina Meat& Provisions Corp.	Brooklyn	NY	-73.924	40.698
M40316	Cal Chef Foods, LLC	Stockton	CA	-121.221	37.931
M40316A	CalChef Foods, LLC	Stockton	CA	-121.231	37.936
M40316B	CalChef Foods, LLC	Stockton	CA	-121.218	37.91
M40322	Just Mike's Jerky Company	Medina	OH	-81.879	41.137
M40326	Crescent Meats and Catering LLC	Cadott	WI	-91.148	45.065
M40327	Bestway Sandwiches Inc.	Valencia	CA	-118.591	34.435
M4033	Bianco Inc.	Medford	MA	-71.078	42.407
M40331	LSG Sky Chefs	Denver	CO	-104.666	39.832
M40334	Five Star Meat, Inc., DBA Emir Halal	Middle Village	NY	-73.876	40.707
M40336	Ranchers Pride Meats	Zullinger	PA	-77.619	39.769
M40339	Unicold Corporation	Oakland	CA	-122.312	37.806
M40342	The Ohio State University	Columbus	OH	-83.029	40.004
M4035	DTF Prep LLC	City of Industry	CA	-117.965	34.024
M40351	Chicharon Poblano LLC	Passaic	NJ	-74.118	40.87
M40353	Sysco South Florida	Medley	FL	-80.379	25.888
M40357	BPT Products Inc.	Sunland Park	NM	-106.559	31.795
M40357B	BPT Products Inc.	El Paso	TX	-106.3	31.687
M40359	Trinity Meat Company LLC	Hartwick	NY	-75.051	42.652
M40363	Pascucci Family Pasta	San Diego	CA	-117.096	32.782
M40365	Four Story Hill Farm Inc.	Honesdale	PA	-75.195	41.704
M40367	Shuler Meats, Inc.	Thomasville	NC	-80.138	35.88
M4037	Plymouth Beef Company, Inc.	Bronx	NY	-73.872	40.807
M40373	Lineage Logistics Bedford Park 1, LLC	Bedford Park	IL	-87.797	41.773
M40374	N.E. Pizza Corp.	Olyphant	PA	-75.606	41.47
M40375A	Villari Food Group	Warsaw	NC	-78.083	34.988
M40381	Champion Foods LLC	New Boston	MI	-83.384	42.131
M40383	The Suter Company	Sycamore	IL	-88.702	41.967
M404	South Chicago Packing LLC	Chicago	IL	-87.649	41.825
M4040	D&D Meat Processing, Inc.	Allen	OK	-96.464	34.882
M40429	California Natural Products	Lathrop	CA	-121.273	37.825
M40432	Callicrate Cattle Co.	St. Francis	KS	-101.843	39.689
M40437	Blue Chip Group	Salt Lake City	UT	-111.982	40.73
M40440	RYC Foods, LLC	San Antonio	TX	-98.51	29.44
M40440A	RYC Foods	San Antonio	TX	-98.428	29.322
M40441	Derstine's Inc.	Sellersville	PA	-75.306	40.344
M40453	Summit Hill Foods, Inc.	Rome	GA	-85.174	34.21
M40458	Better Business - - - Better Foods	Milford	NH	-71.665	42.839
M40463	Levee Way Processing LLC	North Pole	AK	-147.49	64.777
M4049	Levan Bros.	Coatesville	PA	-75.842	40.049
M404A	Ed Miniat LLC	South Holland	IL	-87.629	41.598
M404B	South Chicago Packing LLC	Chicago	IL	-87.652	41.825
M405	Pampanga Food Co. Inc.	Anaheim	CA	-117.91	33.863
M4051	M&D Farm, Inc.	Brooklyn	NY	-73.936	40.714
M4054	Firebrand Jerky LLC	Grandview	WA	-119.894	46.256
M4058	Sigma Alimentos	South Chesterfield	VA	-77.383	37.307
M4059	Rocking Rd Cattle Company	Fairfield	TX	-96.234	31.813
M405A	Pampanga Food Company	Anaheim	CA	-117.909	33.862
M4066	Rocco's Italian Specialty Foods, Inc. dba Top Quality Meats	Huntington	WV	-82.495	38.408
M4071	Rosenkrans Natural Beef Company, LLC	Rochester	NY	-77.615	43.09
M4075	Arnold's & Eddies Foods Inc.	Chicopee	MA	-72.591	42.166
M4079	LaJo Genuine Italian Inc.	Altoona	PA	-78.397	40.514
M4081	Kupelian Foods Inc.	Ridgefield Park	NJ	-74.024	40.845
M4082	Mad Local Food Group, LLC dba Pasture and Plenty	Madison	WI	-89.331	43.125
M4085	Arriba Foods LLC	Houston	TX	-95.531	29.724
M4087	Northern Liberties Food Processors, Inc.	Philadelphia	PA	-75.2	39.937
M4089	Poultry Products of Manchester, LLC, DBA Prime Source Foods	Londonderry	NH	-71.387	42.93
M4093	WP Meat Company	Enfield	IL	-88.333	38.103
M410	Green Bay Dressed Beef, LLC	Green Bay	WI	-87.98	44.511
M4100	Texas Quail Farms, LP	Lockhart	TX	-97.642	29.82
M4102	Morasch Meats, Inc	Portland	OR	-122.5	45.552
M4102A	Pressure Safe LLC	Wood Village	OR	-122.423	45.538
M4104	Palisades Ranch	Vernon	CA	-118.209	33.988
M4111	Wycen Foods, Inc.	San Leandro	CA	-122.156	37.716
M4118	Santa Fe Importers, Inc.	Long Beach	CA	-118.216	33.784
M412	Alpine Meats Inc.	Stockton	CA	-121.318	38.042
M4121	Custom Corned Beef LLC	Wiggins	CO	-104.057	40.24
M4121A	Custom Made Meals, LLC	Denver	CO	-104.982	39.797
M4123	Serv-Rite Meat Company, Inc.	Los Angeles	CA	-118.24	34.107
M413	Smithfield Fresh Meats Corp.	Clinton	NC	-78.31	34.994
M4131	Food Technology Corp.	Henderson	NV	-115.025	36.068
M4132	Schreiner's Fine Sausages	Glendale	CA	-118.229	34.201
M4135	Heartland Meat Company, Inc	Chula Vista	CA	-117.06	32.592
M4138	Green Plant LLC	Miami	FL	-80.369	25.915
M4139	Green Plant LLC	Miami	FL	-80.255	25.828
M4141	Missouri Meat Processing LLC	Rutledge	MO	-92.07	40.35
M4146	Mountain Meat Packing Inc.	Craig	CO	-107.541	40.511
M4149	Perry's Pork Rinds LLC	Bronson	KS	-95.074	37.897
M4150	Tommy's Quality Meats	San Diego	CA	-117.139	32.695
M4155	Wellborn 2R Beef	Henrietta	TX	-98.156	33.845
M4156	Western Meat Service	Denver	CO	-104.98	39.799
M4158	Diana's Mexican Food Products Inc.	Lawndale	CA	-118.349	33.876
M4159	HV Randall Foods, Inc.	Vernon	CA	-118.217	33.999
M4159A	HV Randall Foods, LLC	Vernon	CA	-118.18	34.0
M4160	People's Sausage Company, Inc.	Los Angeles	CA	-118.247	34.03
M4177	Leyen Food, LLC	La Puente	CA	-117.989	34.029
M4178	Quentin Meat Inc.	Santa Fe Springs	CA	-118.053	33.94
M4181	Mao Foods, Inc.	Los Angeles	CA	-118.24	34.006
M4183	Brit Boy Street Food LLC	Kansas City	MO	-94.595	39.182
M4187	Wayne Provisions Company, Inc.	Vernon	CA	-118.191	33.995
M4188	Santos Jerky LLC	Amarillo	TX	-101.841	35.134
M4191	Mikailian Meat Products, Inc.	Valencia	CA	-118.578	34.434
M4192	Dale's Wild West Products	Brighton	CO	-104.819	39.989
M4193	JT Snacks Corp	Dallas	TX	-96.879	32.835
M4195	Newport Meat Southern California, Inc.	Irvine	CA	-117.833	33.695
M42	Edmond's Chile Co. Inc	Saint Louis	MO	-90.23	38.597
M4202	Green's Quality Meats	Celina	OH	-84.575	40.561
M4205	Big Boy Food Group LLC	Warren	MI	-83.063	42.474
M4209	MMM Meat, LLC	Grand Rapids	MI	-85.693	42.942
M4215	Skylark Meats, LLC	Omaha	NE	-96.086	41.215
M4219	Wald Family Foods, LLC	Omaha	NE	-96.055	41.217
M4226	Buddy's Kitchen, Inc.	Burnsville	MN	-93.275	44.785
M4226B	Buddy's Kitchen, Inc.	Lakeville	MN	-93.227	44.643
M4233	National Beef Ohio, LLC	North Baltimore	OH	-83.646	41.185
M4235	Mr. Pizza Inc	Anderson	IN	-85.673	40.094
M424	OWP Boston, LLC	Randolph	MA	-71.07	42.182
M4245	Brandy Meats, Inc.	Cincinnati	OH	-84.535	39.134
M4246	Webster City Custom Meats, Inc.	Webster City	IA	-93.785	42.472
M4253	Joe Pagliuso & Brothers Inc.	Ontario	NY	-77.325	43.246
M4255	Mineo and Sapio's	Buffalo	NY	-78.886	42.907
M4257	Oscar's Hickory House Inc.	Warrensburg	NY	-73.78	43.501
M425B	Kenosha Beef International Ltd	Kenosha	WI	-87.99	42.613
M426	King Meat Service Inc.	Vernon	CA	-118.203	34.003
M4264	Ellio's Pizza	Lodi	NJ	-74.07	40.884
M4265	Locust Grove Farm	Argyle	NY	-73.488	43.216
M4266	Meat & Fisheries Processing Laboratory	Cobleskill	NY	-74.504	42.671
M4271	GREISE BROTHERS PACKING INC.	CUMBERLAND	MD	-78.743	39.693
M4273	SALARINO'S ITALIAN FOOD INC.	CANASTOTA	NY	-75.753	43.077
M4279	Vito A Sindoni & Son Packing Co., LLC	Altamont	NY	-74.052	42.748
M4280	White Eagle Packing Company Inc.	Schenectady	NY	-73.953	42.799
M4286	Rosina Food Products. Inc.	Cheektowaga	NY	-78.748	42.869
M4286A	Rosina Food Products, Inc.	West Seneca	NY	-78.759	42.863
M4286B	Rosina Food Products, Inc.	West Seneca	NY	-78.765	42.86
M4286C	Rosina Food Products, Inc.	Buffalo	NY	-78.763	42.86
M42886	EDCA Foods	Modesto	CA	-120.987	37.618
M429	K & S Sausage	Niagara	WI	-88.036	45.774
M4293	Smith's Log Smokehouse	Monroe	ME	-69.083	44.564
M4299	Moores Specialty Meat Products, Inc.	Bronx	NY	-73.872	40.807
M4322	Japan Premium Beef, Inc.	Bronx	NY	-73.875	40.807
M433	Safari Eats, LLC	Olathe	KS	-94.843	38.929
M4334	Heinsen Products, Inc.	Bronx	NY	-73.888	40.807
M4335	Milan Provision Co., Inc.	Corona	NY	-73.858	40.751
M4357	Camellia General Provision Co., Inc.	Buffalo	NY	-78.83	42.906
M4365	Frank Wardynski & Sons, Inc.	Buffalo	NY	-78.842	42.888
M4367	Lancaster Quality Pork, Inc.	Brooklyn	NY	-74.022	40.647
M4368	Gondola Brand Macaroni Products, Inc	Buffalo	NY	-78.904	42.938
M4369	Jack Toney Wholesale Meats	Warrensburg	NY	-73.776	43.497
M4376A	Cibao Meat Products, LLC	Rockaway	NJ	-74.494	40.919
M4377	Wonder Meats Inc.	Carlstadt	NJ	-74.079	40.832
M4390	Curtis Custom Meats	Warren	ME	-69.21	44.141
M4395	Chef's Delight Packing Co., Inc.	Brooklyn	NY	-73.96	40.72
M4396	Pork King Sausage, Inc.	Bronx	NY	-73.873	40.807
M4398	DiLuigi Foods, Inc	Danvers	MA	-70.975	42.564
M440	Gerber Products Company	Fremont	MI	-85.952	43.47
M4400	U.F.S. Industries, Inc.	Mount Vernon	NY	-73.845	40.919
M4405	JAS Meats, Inc.	Brooklyn	NY	-73.997	40.664
M44051	Eagle Maritime Services Inc.	Miami	FL	-80.33	25.785
M44052	Cal Poly Meats	San Luis Obispo	CA	-120.68	35.32
M44055	MSI Express Inc	Grand Prairie	TX	-97.055	32.787
M44056	F&S Fresh Foods	Houston	TX	-95.293	29.65
M44058	Cedarlane Natural Foods, LLC	Carson	CA	-118.254	33.875
M44062	Stuffed Foods LLC	Wilmington	MA	-71.155	42.524
M44065	Caribbean Snacks & More	Naguabo	PR	-65.738	18.212
M44067	OLD LINE CUSTOM MEAT COMPANY LLC	BALTIMORE	MD	-76.638	39.272
M44070	Hong Chang Corp	Santa Fe Springs	CA	-118.053	33.945
M44072	Penaloza's Food, Inc.	Hawaiian Gardens	CA	-118.065	33.831
M44082	Blue Frog Foods LLC	Austell	GA	-84.634	33.812
M44099	Ridley's Family Markets	Twin Falls	ID	-114.478	42.54
M44121	Pelleh Poultry Corp.	Swan Lake	NY	-74.857	41.706
M44122	Alle-Pia	Atascadero	CA	-120.655	35.473
M44126	LiDestri Foods, Inc.	Rochester	NY	-77.68	43.187
M44127	Adesa International LLC	Ontario	CA	-117.612	34.048
M44127B	Adesa International LLC	San Bernardino	CA	-117.277	34.057
M44134	Surlean Meat Company	Dallas	TX	-96.919	32.702
M44137	Nello's Specialty Meats	Nazareth	PA	-75.283	40.764
M44149	Chickasha Meat Company, LLC	Chickasha	OK	-97.899	35.044
M44150	Golden Grains Bakery	Charlotte	NC	-80.884	35.16
M44151	JSW Farm Chop Shop, Inc.	Hazel Green	KY	-83.342	37.767
M44162	The Pierogi Guy	Rochester	NY	-77.727	43.217
M44163	Tempura Foods & Spices LLC	Houston	TX	-95.538	29.874
M44164	Dorada Foods	Ponca City	OK	-97.11	36.726
M44173	JR's Jerky Company	Albuquerque	NM	-106.584	35.077
M44176A	Stittsworth Smokehouse Co.	Turtle River	MN	-94.764	47.598
M44182	Albaghdadi Food Inc.	Warren	MI	-83.008	42.463
M44187	Sukhi's Gourmet Indian Foods	Hayward	CA	-122.121	37.632
M44189	American Custom Meats LLC	Tracy	CA	-121.434	37.768
M44191	Drakes Food Services, Inc.	Zuni	VA	-76.852	36.783
M44193	Clint & Sons	White Deer	TX	-101.174	35.435
M44193B	Clint & Sons	White Deer	TX	-101.173	35.434
M44195	D.M. Stokke Inc.	Cloquet	MN	-92.365	46.803
M442	Seabrite Corp.	Newark	NJ	-74.136	40.733
M44200	Nettles Beef Processing Inc.	Lake City	FL	-82.601	30.066
M44207	Mill Creek Meats and Processing	Marshall	IL	-87.801	39.451
M44214	Loham, Inc.	Colton	CA	-117.322	34.083
M44215	Sea Watch International	Milford	DE	-75.417	38.913
M44217	Schrock's Slaughter House	Gladys	VA	-79.005	37.17
M44220	United Group Meats LLC	Newark	NJ	-74.179	40.718
M44223	V & V Products, Inc.	Flatonia	TX	-97.218	29.817
M44235	Wyhe's Choice	Lester	IA	-96.333	43.438
M44299	Thompson Sausage Co.	Alexandria	AL	-85.868	33.743
M443	Glenn Valley Foods, LLC.	Omaha	NE	-96.019	41.216
M4432	Parillo Sausage	Saratoga Springs	NY	-73.791	43.08
M4440	The Alps Provision Co., Inc.	Long Island City	NY	-73.905	40.769
M4445	Picone Meat Specialties LTD	Mamaroneck	NY	-73.737	40.956
M4460	Great American Foods	Newark	NJ	-74.146	40.718
M4465	Nicholas Meat LLC	Loganton	PA	-77.287	41.036
M4466	Dino's Sausage & Meat Co., Inc.	UTICA	NY	-75.216	43.099
M44739	D Bar B Sausage	Brenham	TX	-96.414	30.146
M44741	Mickey's Wholesale Pizza	York	PA	-76.7	39.863
M44742	Kimia Kitchen	santa Ana	CA	-117.852	33.74
M44750	Kosher R Us	Brooklyn	NY	-74.022	40.647
M44753L	Tall Hat Foods	Lindon	UT	-111.748	40.334
M44754	Tamahli	San Antonio	TX	-98.503	29.554
M44762	TJ Processors, LLC	Seattle	WA	-122.339	47.564
M44764	SOPAKCO, Inc.	Mullins	SC	-79.263	34.202
M4477	JOSEF MEILLER SLAUGHTERHOUSE INC.	PINE PLAINS	NY	-73.667	41.983
M44771	Sugargrove Country Hams	North Wilkesboro	NC	-81.104	36.132
M44778	Holy Pierogies	Wolcott	CT	-72.974	41.562
M44779	Spencer County Butcher Block	Taylorsville	KY	-85.341	38.035
M44781	Sterling Foods	Union City	CA	-122.032	37.598
M44788	Old Fashion Country Butcher	Santa Paula	CA	-119.065	34.347
M44791	Doublebrook Farm LLC	Princeton	NJ	-74.741	40.355
M44797	CCB Packaging, Inc.	Hiawatha	IA	-91.691	42.058
M44798	Erika Lynch LLC	Waitsfield	VT	-72.838	44.187
M4480	Croghan Meat Market ,Inc.	Croghan	NY	-75.392	43.895
M44801	Halal Transaction of USA llc	Kinsman	IL	-88.567	41.192
M44803	Gourmet 3005 Inc.	Hialeah	FL	-80.33	25.893
M44805	The Heywoods Group Corp	Atlanta	GA	-84.425	33.788
M44809	Lionshare LLC	Houston	TX	-95.398	29.847
M44814	Aufschnitt Meats LLC	Owings Mills	MD	-76.781	39.414
M44818	Taylor Farms Florida, Inc.	Orlando	FL	-81.413	28.456
M44819	Fatback	Eva	AL	-86.723	34.311
M4482	Kelley Meats LLC	Taberg	NY	-75.613	43.295
M44821	Good to Go Fresh	Chicago	IL	-87.65	41.9
M44824	Western Meat Processing, Inc.	Modesto	CA	-120.997	37.619
M44829	FLYING W FARMS, LLC	BURLINGTON	WV	-78.907	39.336
M44830	FLYING W FARMS, LLC	BURLINGTON	WV	-78.928	39.339
M44836	Khuus Sausage, Inc.	Monrovia	CA	-118.003	34.141
M44838	Hunter Cattle Company	Brooklet	GA	-81.557	32.372
M44847	Great North Pizza Inc.	Detroit Lakes	MN	-95.831	46.835
M4485	PREVITES MEATS AND PROVISIONS	WEYMOUTH	MA	-70.921	42.194
M4486	N S Brandon Packing Inc.	Otego	NY	-75.174	42.393
M44868	Stafford's Custom Meats	Elgin	OR	-117.915	45.553
M44869	Trig's Smoke House	Rhinelander	WI	-89.397	45.656
M44870	Rana Meal Solutions, LLC	Bartlett	IL	-88.229	41.984
M44874	SMC Foods, LLC	Statham	GA	-83.592	33.959
M44877	Nonna's Homestyle Foods	St. Louis	MO	-90.284	38.571
M4488	Valley Meat Packing Corp.	Newark Valley	NY	-76.118	42.188
M44883	Fusion Ranch, Inc.	Scottsbluff	NE	-103.589	41.864
M44891	Kukui Meat Market	Honolulu	HI	-157.881	21.326
M44892	R. Walters, LLC, DBA Elevation Foods	Danvers	MA	-70.947	42.56
M44893	Malafy's Meat Processing, LLC	Red Hook	NY	-73.793	41.986
M44902	Old Fashioned Foods, Inc.	Mayville	WI	-88.545	43.504
M44904	AA Meat Products Inc.	Commerce	CA	-118.133	34.006
M44910	Rising Spring Meat Co.	Spring Mills	PA	-77.566	40.853
M44913	Villarina's Pasta & Fine Foods	Danbury	CT	-73.421	41.388
M44915	D & H CUSTOM MEATS LLC	BLACKSVILLE	WV	-80.231	39.718
M44916	ISF (USA), LLC / HIGH LINER FOODS	Newport News	VA	-76.582	37.174
M44919	Cuisine Solutions, Inc.	Sterling	VA	-77.444	38.994
M44921	Aminchi Foods International, Inc.	Houston	TX	-95.492	29.976
M44926	Sun Foods	Detroit	MI	-83.135	42.396
M44930	Huang's Meat Trading	Brooklyn	NY	-74.01	40.653
M44934	Bronson Locker LLC	Bronson	KS	-95.073	37.895
M44936	Gracie's Kitchens, Inc.	New Haven	CT	-72.921	41.294
M44941	Alcor Foods, Inc.	Bayamon	PR	-66.162	18.356
M44942	Glondo's Sausage Co.	Cle Elum	WA	-120.935	47.194
M44946	Romeo Foods Inc	Brooklyn	NY	-74.005	40.616
M44950	Schrader Farms, LLC	Romulus	NY	-76.836	42.745
M44954	Global Food Corp.	Medley	FL	-80.382	25.883
M44956	Husks Unlimited Inc.	San Diego	CA	-116.933	32.559
M44965	CLW Foods, LLC	Vernon	CA	-118.212	34.006
M44972	Wyoming Authentic Products LLC	Cody	WY	-109.04	44.514
M44976	Empacadora y Procesadora del Sur	Coamo	PR	-66.366	18.076
M44977	Jackson's Sausage, LLC	Auburn	KY	-86.663	36.782
M44979	Papa Pasquale Ravioli and Pasta Company	Brooklyn	NY	-74.005	40.616
M44980	New Horizon Cuisine	Ankeny	IA	-93.594	41.716
M44985	Bowman's Butcher Shop, LLC	Aberdeen	MD	-76.217	39.54
M4499	Tri-Town Packing Corporation	Brasher Falls	NY	-74.787	44.863
M44993	Musa Halal Slaughter House, LLC	Tampa	FL	-82.393	28.004
M44999	Brush Meat Processors LLC	Brush	CO	-103.636	40.252
M44A	Conagra Brands, Inc.	Quincy	MI	-84.822	41.962
M45001	Day Day's Skins & Cracklings	Marietta	NC	-79.129	34.366
M45006	Great American Deli, LLC	Ooltewah	TN	-85.059	35.079
M45008	Carrington Foods, Inc	Saraland	AL	-88.067	30.804
M45009	Readywise Inc.	Salt Lake City	UT	-111.969	40.737
M45014	Mrs. Williams Country Kitchen Inc.	Westlake Village	CA	-118.832	34.158
M45015	American Pasteurization Company	West Sacramento	CA	-121.541	38.569
M45020	Yuris Food, LTD	Houston	TX	-95.521	29.869
M45026	TRADITIONAL SNACK, INC	Miami	FL	-80.315	25.822
M45029	Vermont Packinghouse, LLC	North Springfield	VT	-72.541	43.331
M45031	Cheesewich LTD	Hodgkins	IL	-87.86	41.767
M4504	Janowski Hamburgers	Rockville Centre	NY	-73.634	40.654
M45048	New Manna Food	Tamuning	GU	144.814	13.516
M45053	Pacific Prime Meats, LLC	Vernon	CA	-118.208	34.006
M45054	VP Foods, Inc.	Fairview	NJ	-74.003	40.819
M45056	L&G Food Inc.	El Monte	CA	-118.068	34.056
M45062	Shorty's Sandwich Shop	Phoenix	AZ	-112.0	33.407
M45064	Dan O's. LLC	St. Charles	MO	-90.515	38.835
M45073	Vertical Cold Storage LLC	Pooler	GA	-81.248	32.166
M45074	Get Fresh Kitchen	Las Vegas	NV	-115.095	36.076
M45080	Bas Foods Inc.	Hayward	CA	-122.053	37.623
M45081	Leader Slaughterhouse, LLC	Imler	PA	-78.494	40.252
M45086	The Centerville Pie Company	Sandwich	MA	-70.486	41.719
M45091	Taher, Inc.	Plymouth	MN	-93.41	45.047
M45093	AleCon Enterprises Inc.	Pelham	NH	-71.319	42.705
M45096	Traditions Prepared Meals, LLC	Sacramento	CA	-121.563	38.68
M45099	Responsible Transportation LLC	Sigourney	IA	-92.18	41.365
M45103	Archie's Foods, Inc.	Skokie	IL	-87.738	42.026
M45106	Grab & Go, LLC	Boston	MA	-71.065	42.329
M45107	R-C Ranch Texas Craft Meats, LLC	Houston	TX	-95.381	29.81
M45109	Augustine's Italian Village Inc.	New Castle	PA	-80.292	40.994
M45119	Red Barn Meats, Inc.	Croghan	NY	-75.349	43.872
M45123	Cape Code Cafe Foods	Brockton	MA	-71.017	42.066
M45139	Peer and Mariah Foods	Greenfield	IN	-85.906	39.778
M45141	Fieldsource Food Systems, Inc.	Brea	CA	-117.895	33.922
M45143	Craft Kitchens	Maryland Heights	MO	-90.443	38.705
M45147	Choice Products USA	Eau Claire	WI	-91.542	44.835
M45150	Tandem USA, LLC	Schaumburg	IL	-88.093	42.002
M45160	Lehigh Valley Meats LLC	Nazareth	PA	-75.284	40.794
M45163	Espuna, LLC	Gloversville	NY	-74.355	43.033
M45170	Marchiano's Bakery LLC	Philadelphia	PA	-75.225	40.031
M45175	Marquez Brothers International, Inc.	Modesto	CA	-121.005	37.64
M45176	New England Wagyu, LLC	Center Barnstead	NH	-71.235	43.32
M45179	Roger's Poultry	Los Angeles	CA	-118.237	33.978
M45189	Woody's Oasis Mediterranean, LLC	East Lansing	MI	-84.498	42.719
M45190	Garden Path Farms	Newburg	PA	-77.516	40.145
M45191	Abner Snack Foods, Inc.	Bell City	MO	-89.816	37.024
M45192	Nibai Inc.	South El Monte	CA	-118.061	34.049
M45195	Gateway America LLC	Gulfport	MS	-89.071	30.4
M451B	Sterling Foods, Inc.	Opa Locka	FL	-80.262	25.892
M4520	Symrise	Branchburg	NJ	-74.713	40.599
M45200	Niihau Ahiu Provisions LLC	Kaumakani Kauai	HI	-159.626	21.92
M45201	Limit Bid Packing	Odessa	WA	-118.687	47.316
M45204	Russ Davis Wholesale, Inc.	Saint Paul	MN	-93.106	44.961
M45208	ASC Lockers, LLC	West Point	NE	-96.707	41.857
M45209	Texas County Meat Processing, LLC	Cabool	MO	-92.1	37.113
M45210	Pennsylvania Food Corporation	Charleroi	PA	-79.886	40.122
M45212	Wakou USA Inc.	Santa Fe Springs	CA	-118.035	33.899
M45217	Choice Canning Company Inc.	PIttston	PA	-75.77	41.308
M45218	Kalapooia Valley Grassfed Processing	Brownsville	OR	-122.945	44.368
M45220	Hilltown Country Smokehouse LLC	New Lebanon	NY	-73.417	42.469
M45230	Against The Grain Gourmet	Brattleboro	VT	-72.551	42.888
M45231	Caldwell Farms Beef	Turner	ME	-70.222	44.292
M45232	Marne Specialties and Meats, LLC	Kent City	MI	-85.758	43.22
M4524	Family Food Products, Inc.	Bensalem	PA	-74.923	40.107
M45243	Mama La's Kitchen, LLC	Houston	TX	-95.332	29.723
M45246	SA Quality Meats	San Antonio	TX	-98.595	29.479
M45251	Portillo's Hot Dogs, LLC.D/B/A Portillo's Food Service, LLC	Addison	IL	-88.033	41.92
M45255	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Romeoville	IL	-88.111	41.659
M45256	Truvant Foods NA, LLC	Boscobel	WI	-90.694	43.144
M45257	PurFoods, LLC	Grinnell	IA	-92.725	41.706
M45258	Daves Creek Meat Market	Carnesville	GA	-83.311	34.45
M45261	Fort McCoy Meat LLC	Fort McCoy	FL	-81.997	29.422
M45262	The Kitchen Inc.	Sterling Heights	MI	-83.041	42.554
M45265	El Zipote Foods	Montebello	CA	-118.12	33.995
M45269	Epicurean Catering LLC	Las Vegas	NV	-115.204	36.076
M45274	Columbus Vegetables Oils	Des Plaines	IL	-87.915	42.02
M4528	Big Mouth/Cudlins	Newfield	NY	-76.617	42.347
M45286	KMB Foods	San Bernardino	CA	-117.287	34.082
M45288	California Ranch Food Company	Vernon	CA	-118.205	34.003
M45288B	FW Farms LLC.	Fort Worth	TX	-97.299	32.648
M45292	Oliveros Distribution Commissary	Turlock	CA	-120.877	37.491
M45302	Freedom Meats Inc.	Las Vegas	NV	-115.177	36.136
M45314	Korte Meat Processing Inc.	Highland	IL	-89.698	38.743
M45316	Fotis And Son Imports, Inc.	Huntington Beach	CA	-118.027	33.738
M45316A	Fotis and Son Imports, Inc.	Huntington Beach	CA	-118.027	33.739
M45317	Kitchen Cuts LLC.	Maywood	CA	-118.171	33.983
M4532	Owasco Meat Company, Inc.	Moravia	NY	-76.419	42.718
M45321	Upper Iowa Beef LLC	Lime Springs	IA	-92.297	43.449
M45322	Mama Vicky's Inc.	North Hollywood	CA	-118.373	34.195
M45330	Baily International, LLC	Granite City	IL	-90.159	38.706
M45332	Fifty Four Eleven Store 2 LLC	Chicago	IL	-87.679	41.91
M45334	OLLI SALUMERIA AMERICANA	OCEANSIDE	CA	-117.29	33.214
M45335	Bakkavor US - Carson	Carson	CA	-118.25	33.866
M45339	Buckskins L.L.C.	Newton	AL	-85.61	31.252
M45341	Integrated Marketing Technologies, Inc.	Brunswick	OH	-81.791	41.25
M45344	Allen Brothers LLC	Las Vegas	NV	-115.259	36.084
M45345	Wheatech Food CA Inc.	Irwindale	CA	-117.936	34.109
M45348	NGPM Food Products	Aibonito	PR	-66.278	18.13
M45360	JLM Manufacturing	Warren	MI	-82.979	42.486
M45361	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Wilmington	OH	-83.775	39.445
M45362	Authentic Brands of Chicago	Bedford Park	IL	-87.782	41.758
M45367	SK Food Group	Groveport	OH	-82.926	39.851
M45367A	SK Food Group Inc	Columbus	OH	-82.943	39.825
M45371	Wilson Processing Company, Inc.	Westminster	SC	-83.029	34.676
M45377	3D Meats, LLC	Dalton	OH	-81.719	40.801
M4538	T.O. Nam Sausage, Inc.	Cranston	RI	-71.426	41.776
M45387	Rich Products Corporation	Crest Hill	IL	-88.139	41.578
M45392	TTJ Packing Inc.	Cottage Grove	WI	-89.201	43.062
M45394	CM & R, Inc.	St. Paul	MN	-93.026	44.963
M45399	Masterson's Food & Drink Inc	Louisville	KY	-85.728	38.251
M45401	Triple C Meats	Anna	IL	-89.148	37.449
M45403	Watkins Ranch Butcher Shop	Meiners Oaks	CA	-119.276	34.448
M45404	Urseilas Meat II	Los Angeles	CA	-118.301	33.989
M45407	Ameripack Foods LLC	Hughes Springs	TX	-94.634	32.968
M45419	Egea Food LLC	Miami	FL	-80.19	25.947
M4542	Kennedy Meat Market	Randolph	NY	-79.0	42.168
M45420	Dockside Seafood	San Juan	PR	-66.101	18.413
M45422	Saba Livestock	Orland	CA	-122.197	39.681
M45427	Phil's Farm	Hutchinson	KS	-98.014	37.992
M45431	West Liberty Foods, LLC	Bolingbrook	IL	-88.085	41.674
M45433	Halperns' Steak and Gary's Seafood	Orlando	FL	-81.415	28.448
M45434	Demaiz Inc. dba: Mextamale Foods	San Jose	CA	-121.863	37.347
M45435	Beef Jerky Unlimited	Luna Pier	MI	-83.447	41.808
M45438	Salt Blade, LLC	Seattle	WA	-122.343	47.7
M45439	Tri Eagle LLC	Gary	IN	-87.359	41.556
M4544	Sweet N Spicy Foods, Inc.	Baltimore	MD	-76.661	39.312
M45440	Lineage Logistics LLC	Stevens Point	WI	-89.501	44.511
M45444	Janey Lou's, LLC	Salt Lake City	UT	-112.035	40.781
M45448	VAM Foods LLC	Conroe	TX	-95.405	30.297
M45449	Favazza Specialty Foods	Maryland Heights	MO	-90.437	38.719
M45455	Century Harvest LLC	Greenback	TN	-84.183	35.652
M45457	Evergreen Poultry	Fort Worth	TX	-97.326	32.703
M45458	Shale Spring Meats, LLC	Clyde	NY	-76.879	43.112
M45459	Waterloo Poultry Processing LLC	Clinton	WI	-88.933	42.575
M45462	Berix Coffee Deli LLC	St. Louis	MO	-90.269	38.58
M45464	Victor Provisions	Brooklyn	NY	-73.935	40.71
M45467	Deering's Jerky Co.	Interlochen	MI	-85.802	44.658
M45469	Latitude 36 Foods LLC	West Chester	OH	-84.443	39.328
M45471	New Angus, LLC	Aberdeen	SD	-98.484	45.428
M45475	YouBite, LLC	Camarillo	CA	-119.093	34.218
M45476	Fresno Meat Cuts, LLC	Fresno	CA	-119.778	36.726
M45477	Rotisystems Inc.	San Leandro	CA	-122.18	37.708
M45477A	Rotisystems, Inc.	Oakland	CA	-122.203	37.742
M45479	Rettland Farm, LLC	Gettysburg	PA	-77.175	39.784
M4548	Palmer Food Service	Rochester	NY	-77.669	43.111
M45482	J&J Smoked Meats	Cadillac	MI	-85.416	44.228
M45484	Southern Hens Inc	Moselle	MS	-89.306	31.526
M45487	BakeMex	Garland	TX	-96.672	32.873
M45490	J and L Butcher Shop, LLC	Medway	OH	-83.983	39.888
M45493	Julius Falkavage LLC	Stevens Point	WI	-89.447	44.457
M45499	Jemstar Meats LLC	Mt. Sterling	KY	-83.949	38.127
M45504	VKGG Inc.	Wheatridge	CO	-105.108	39.787
M45505A	Mama Cho's BBQ	San Leandro	CA	-122.148	37.741
M45508	Kraft Heinz Foods Company	Garland	TX	-96.663	32.907
M45510	Queen City Fresh Foods, LLC	Lackawanna	NY	-78.846	42.817
M45512	Cookout	Oakwood	GA	-83.867	34.229
M45517	Trailtopia LLC	Byron	MN	-92.659	44.029
M45522	Tequenomania	Miami	FL	-80.359	25.593
M45523	Fresco Foods, Inc.	Tampa	FL	-82.344	27.972
M45523A	Fresco Foods, Inc.	Hatfield	PA	-75.307	40.272
M45525	Pine Creek Processing LLC	Ridgeland	WI	-91.892	45.208
M45526	Katie's Snack Foods	Hilliard	OH	-83.129	40.042
M4553	Alex & George Wholesale Meats, Inc.	Rochester	NY	-77.552	43.146
M45530	Foodway	Shreveport	LA	-93.766	32.489
M45531	Mertzon Meat Company, LLC #2	San Angelo	TX	-100.398	31.475
M45533	Mississippi State University Meat Laboratory	Mississippi State	MS	-88.801	33.447
M45534	Vista Meat Processing LLC	Milpitas	CA	-121.889	37.425
M45535	Stutzman Brothers Meats LLC	Sturgis	MI	-85.344	41.804
M45537	Nestle R&D Center Inc.	Solon	OH	-81.471	41.408
M45544	Northeast Prime Veal, LLC	Taylor	PA	-75.702	41.399
M45545	Lagudi Fresh Food Group	Las Vegas	NV	-115.215	36.089
M45547	Mucca, Inc.	Gardena	CA	-118.303	33.902
M45553	Sonoma Muffin Works	Sebastopol	CA	-122.811	38.385
M45556	Green Dining Table, Inc.	Alhambra	CA	-118.147	34.083
M45557	El Charrito Foods, Inc.	City of Industry	CA	-117.973	34.029
M45565	Farm Fresh Foods, LLC	Guntersville	AL	-86.283	34.31
M45570	Eader's Butcher Shop	Big Cove Tannery	PA	-78.12	39.785
M45571	Rana Meal Solutions	Barlett	IL	-88.222	41.984
M45572	BJG Meat Co LLC	Grandin	MO	-90.752	36.826
M45585	The Butcher Block & Smokehouse LLC	Versailles	OH	-84.571	40.19
M45588	Mosul Kubba	Troy	MI	-83.182	42.545
M45594	John's Meats, LLC	Brooklyn	NY	-73.932	40.664
M45597	Premier Custom Foods	Kansas City	KS	-94.628	39.079
M45599	Lake Haven Custom Meat Processing, LLC	Sturgeon Lake	MN	-92.716	46.402
M456	Bad River Jerky	Chamberlain	SD	-99.329	43.812
M45600	Get Hooked Quality Foods Inc.	Los Lunas	NM	-106.723	34.757
M45601	Maxim Find Food LLC	City of Industry	CA	-117.872	33.993
M45607	Trackside Butcher Shoppe	Campbellsburg	KY	-85.189	38.53
M45608	Pure Country Harvest LLC	Moses Lake	WA	-119.303	47.102
M45609	Empanadas 305	Hialeah	FL	-80.287	25.847
M45613	Divine Pasta Co.	Los Angeles	CA	-118.24	34.04
M45616	TFC Foods Specialty Inc.	South El Monte	CA	-118.068	34.058
M45617	Nathan's Soup & Salad	Rochester	NY	-77.614	43.089
M45622	Salt Marsh Foods, Inc.	New Bedford	MA	-70.945	41.652
M45623	Good Foods Group, LLC	Pleasant Prairie	WI	-87.914	42.527
M45624	George Brothers & Associates Inc	Ann Arbor	MI	-83.731	42.261
M45625	The Flying Meatballs LLC	Easton	PA	-75.268	40.729
M45626	F-16 Custom Cuts LLC	Bronx	NY	-73.872	40.807
M45628	Sunrise Deli LLC	Hibbing	MN	-92.942	47.426
M45629	Andy's Meats Inc.	Endeavor	WI	-89.468	43.696
M45638	Trilogy Foods LLC	Gainesville	GA	-83.807	34.26
M45640	Brazilian Taste	Lexington	SC	-81.173	33.972
M45643	Sendjoeskcbbq, LLC	Olathe	KS	-94.768	38.912
M45647	Screamin' Ridge Farm Inc.	Montpellier	VT	-72.572	44.254
M4565	Garfield's Smokehouse, Inc.	Meriden	NH	-72.258	43.546
M45652	Shah's Halal Food & Products Inc.	Jamaica	NY	-73.81	40.698
M45659	Embutidos Fanguito Inc.	Miami	FL	-80.22	25.799
M45664	El Paso Prepared Foods	El Paso	TX	-106.319	31.729
M45673	Grassland Beef, LLC	Canton	MO	-91.545	40.122
M45679	Hubbard's Country Meats LLC	Thomasville	GA	-83.92	30.925
M45682	Sky Blue Enterprises LLC.	Chicago	IL	-87.651	41.812
M45686	Rio Bravo Distribution	Phoenix	AZ	-112.055	33.445
M45687	Meat Palace Corp.	Brooklyn	NY	-73.874	40.663
M45690	Selim's Doner Kebap House L.P.	Dallas	TX	-96.702	32.912
M45692	Barakah Kabab Inc.	Detroit	MI	-83.214	42.344
M45693	Harvest Kitchen	Ann Arbor	MI	-83.752	42.333
M45694	Ruiz Food Products, Inc.	Florence	SC	-79.685	34.27
M45696	The Honest Stand	Niwot	CO	-105.177	40.091
M45705	Meat Processing Career Center	Orient	OH	-83.148	39.803
M45710	Sky Chefs, LLC	Phoenix	AZ	-112.021	33.415
M45712	Boar's Head Provisions Co., Inc.	New Castle	IN	-85.386	39.872
M45715	Uncle Henry's Gourmet Meats	Troy	MI	-83.123	42.557
M45719M	Assemblers Inc.	McCook	IL	-87.835	41.804
M45721	Perfecto Foods Inc.	Bell	CA	-118.195	33.979
M45724	Dandee Foods	Jacksonville	FL	-81.696	30.356
M45726S	No Man's Land Foods, LLC	Enid	OK	-97.865	36.419
M45729	Westcliffe Meats	Westcliffe	CO	-105.479	38.087
M4573	Forest Pork Store, Inc.	Ridgewood	NY	-73.903	40.707
M45736	Claysburg Pizza Fundraisers	Claysburg	PA	-78.453	40.3
M45741	Down Home Processing, Inc.	Tazwell	TN	-83.607	36.484
M45742	LSI Specialty Meats	Centerville	TN	-87.481	35.773
M45744	The BrothFarm LLC	Siren	WI	-92.396	45.783
M45746	FiveStar Gourmet Foods	Naples	FL	-81.68	26.162
M45750	New York Meat and Fish Market	Bronx	NY	-73.92	40.804
M45753	Young Ocean, Inc.	Kent	WA	-122.234	47.42
M45754	EL CHURRY, INC	SAN JUAN	PR	-66.079	18.347
M45756	Nutrition, Inc.	Girard	OH	-80.665	41.19
M45758	CP Fresh	Seattle	WA	-122.312	47.521
M45761	Classroom Kitchen, LLC	Phoenix	AZ	-112.112	33.583
M45762	La Nonna Kitchen LLC	Los Angeles	CA	-118.264	33.984
M45764	S Street Management	Fort Lauderdale	FL	-80.143	26.086
M45766	Rico's Burritos	Watkins	CO	-104.584	39.639
M45767	Consolidated Catfish Producers, LLC	Eutaw	AL	-87.882	32.829
M45768	America's Catch, Inc.	Itta Bena	MS	-90.38	33.527
M45769	Colorado Native Foods LLC	Denver	CO	-104.857	39.784
M45772	Diller Locker Company, LLC	Diller	NE	-96.936	40.107
M45772A	Diller Locker Company	Diller	NE	-96.935	40.11
M45773	International Meat Processors Inc.	Long Beach	CA	-118.203	33.787
M45773A	International Meat Processor SF	San Francisco	CA	-122.394	37.725
M45776	Consolidated Catfish Producers, LLC	Isola	MS	-90.593	33.256
M45777	Heartland Catfish Company, LLC	Itta Bena	MS	-90.299	33.528
M45778	Catfish Processors, LLC	Belzoni	MS	-90.411	33.186
M45782	Magnolia Processing Inc	Tunica	MS	-90.4	34.687
M45783	Service Cold Storage / Port Everglades Frozen Storage LLC	Fort Lauderdale	FL	-80.142	26.085
M45788	Processors, L.L.C.	Breaux Bridge	LA	-91.822	30.313
M45798	Del Monte Capitol Meat Company, LLC	Reno	NV	-119.799	39.551
M45800	Cedarlane Natural Foods, LLC	Carson	CA	-118.264	33.875
M45806	Schneider's Fish and Seafood Corp.	Cheektowaga	NY	-78.759	42.87
M45808	Mazzone Pasta LLC	Bloomingdale	IL	-88.125	41.949
M45809	Bama Sea Products	St. Petersburg	FL	-82.67	27.762
M45814	Smithermans Catfish Co	Clanton	AL	-86.604	32.913
M45826	Schafer Fisheries, Inc.	Thomson	IL	-90.113	41.961
M45832	VERONI USA, INC	LOGAN	NJ	-75.371	39.769
M45833	Avril Bleh Meats	Cincinnati	OH	-84.513	39.106
M45835	Taylor Farms	Des Moines	WA	-122.305	47.414
M45836	Hillcrest Meats LLC	Garden City	SD	-97.669	44.947
M45837	Market Fish Inc.	Chicago	IL	-87.625	41.765
M45843	Conger Meat Market, LLC	Conger	MN	-93.529	43.614
M45847	Kencor Ethnic Foods, Inc.	Canton	IL	-90.069	40.559
M45848	Tanks Meats Inc.	Elmore	OH	-83.299	41.467
M45850	South Florida Food Merchants	Davie	FL	-80.21	26.06
M45851	Italian Ready Meals LLC	Waltham	MA	-71.237	42.374
M45853	Macelleria DeMaria LLC	Cortland Manor	NY	-73.853	41.267
M45855	Interstate Foods Inc.	Compton	CA	-118.207	33.894
M45858	Puget Sound Processing, LLC	Rochester	WA	-123.068	46.802
M4586	TMAC Food Services, Inc.	Buffalo	NY	-78.871	42.875
M45860	Tucson Tamale Wholesale Company LLC	Tucson	AZ	-111.0	32.253
M45874	Midwest Regional Processing LLC	Sun Prairie	WI	-89.187	43.206
M45877	Great Plains Beef	Lincoln	NE	-96.607	40.86
M45883	Foodie'J Inc	Woodbine	GA	-81.683	30.843
M45884	Chef Creations LLC	Forest Park	GA	-84.379	33.608
M45886	TF Foods, LLC	San Diego	CA	-117.165	32.884
M45888	Master Sausage LLC	Orlando	FL	-81.428	28.509
M45889	IVY CITY SMOKEHOUSE	WASHINGTON	DC	-76.986	38.915
M45890	Gourmet Express Marketing, Inc.	Addison	IL	-88.025	41.922
M45891	Kassian Farms LLC	Bronx	NY	-73.921	40.803
M45896	International Frozen Products USA LLC	Miami	FL	-80.194	25.941
M45899	FAMILY KITCHEN RAVIOLI	FLANDERS	NJ	-74.701	40.88
M45901	Foothill Meat Company, Inc.	Oroville	CA	-121.504	39.483
M45904	Crappell's Fish Market LLC	Berwick	LA	-91.216	29.694
M45911	Meridian Meat Packers	Meridian	ID	-116.391	43.626
M45913	Avalon Meat Candy, LLC	Las Vegas	NV	-115.126	36.07
M45915	Harlon's LA Fish LLC	Kenner	LA	-90.267	29.979
M45918	KBBQ Meat Company	Downey	CA	-118.118	33.92
M45919	Circle C Farm Abattoir & Butcher Shop, LLC	Felda	FL	-81.451	26.553
M4592	Treasure Isle Foods	Mineola	NY	-73.638	40.742
M45923	Bill E's Small Batch Bacon LLC	Fairhope	AL	-87.852	30.516
M45925	Frigopack USA Inc	Elizabeth	NJ	-74.197	40.672
M45927	Abner Snack Foods, Inc.	Bell City	MO	-89.82	37.024
M4593	Greenbrier Meat Company, Inc.	Lewisburg	WV	-80.446	37.81
M45932	Productos Dany Inc.	Hatillo	PR	-66.799	18.374
M45942	Synear Foods USA, LLC	Chatsworth	CA	-118.6	34.244
M45944	JEB'S CORNER MARKET, INC.	CARROLLTON	VA	-76.516	36.922
M45945	Home Place Pastures	Como	MS	-89.862	34.507
M45948	729 Beef LLC	Burley	ID	-113.912	42.423
M45950	Sanders Meat Service	Turlock	CA	-120.863	37.485
M45951	Morris Meat Plant 1239	Morris	IL	-88.438	41.39
M45960	It's All About You Catering / Simple Bites	Meridian	ID	-116.412	43.606
M45963	The Original Crunch Roll Factory, LLC	Westfield	NY	-79.58	42.332
M45964	Jamaican Flavors Patties, Inc.	Jamaica	NY	-73.773	40.66
M45977	Out of the Shell dba Yangs or Lings	South El Monte	CA	-118.059	34.056
M45980	Circle S Farms	Lebanon	TN	-86.429	36.253
M45986	Brothers Quality Halal Meat, LLC	Paterson	NJ	-74.149	40.894
M45989	Processadora La Esperanza Inc.	Barranquitas	PR	-66.316	18.188
M45997	Brooke & Bradford LLC	Salt Lake City	UT	-111.971	40.753
M45999	The Meat Locker, LLC	Bend	OR	-121.265	44.055
M46002	Kanani Foods II, Inc.	Las Vegas	NV	-115.184	36.128
M46006	AZ Grass Fed Beef	Chino Valley	AZ	-112.465	34.726
M46007	CJ Foods Manufacturing Corporation	Fullerton	CA	-117.888	33.867
M46009	CJ Foods Manufacturing Beaumont Corporation	Beaumont	CA	-116.996	33.928
M46011	Homestead Farm and Packing, LLC	Lucedale	MS	-88.471	30.982
M46013	Stanley Pearlman Enterprise	Jessup	MD	-76.782	39.156
M46013A	Stanley Pearlman Enterprises	Jessup	MD	-76.784	39.157
M46018	Shiners Stash Inc	North Wilkesboro	NC	-81.173	36.154
M46020	Lydia's Ladle, LLC	St. Louis	MO	-90.273	38.549
M46023	Wyoming Legacy Meats, LLC	Cody	WY	-109.057	44.544
M46025	Maverick Caterers, LLC	Hackensack	NJ	-74.051	40.88
M46031	Grand Taste Corporation	City of Industry	CA	-117.981	34.035
M46033	Hanoon Foods llc	Pomona	CA	-117.736	34.058
M46043	Goldbergs Commissary, LLC	Marietta	GA	-84.492	33.913
M46045	Colorado Green Chili, LLC	Colorado Springs	CO	-104.862	38.841
M46046	Roth Premium Foods, LLC	Colorado Springs	CO	-104.792	38.996
M46049	Cargill Meat Solutions	Round Rock	TX	-97.688	30.505
M4605	PDH Markets	Endicott	NY	-76.04	42.124
M46052	Ladyfingers Caterers/Ladyfingers Gourmet To Go	Raleigh	NC	-78.596	35.849
M46053	Terra di Siena USA, LLC	AMELIA COURT HOUSE	VA	-77.954	37.467
M46053A	Terra Di Siena USA LLC	Mechanicsville	VA	-77.353	37.641
M46058	Great Lakes Pot Pies	Clawson	MI	-83.158	42.533
M4606	Hamilton Meats Supply Inc.	Pine City	NY	-76.859	42.041
M46060	Back 40 Butchery	Hodges	SC	-82.238	34.278
M46061	Chao Siam LLC	Waipahu	HI	-158.024	21.379
M46064	Carmine's Frozen Pizza, LLC	Durham	CT	-72.68	41.467
M46068	Horton's Quality Meats	Springfield	GA	-81.368	32.448
M46069	RED'S ALL NATURAL, LLC.	NORTH SIOUX CITY	SD	-96.499	42.541
M4607	Hyndman Halal Meat LLC	Hyndman	PA	-78.75	39.767
M46071	Seaboard Triumph Foods	SIOUX CITY	IA	-96.384	42.421
M46072	Quality Pork International Inc. - West Point	West Point	NE	-96.713	41.839
M46075	Grayson Smokehouse LLC	Independence	VA	-81.128	36.622
M46079	Farmview Market	Madison	GA	-83.46	33.541
M46085	Triad Halal Meats LLC	Madison	NC	-79.995	36.412
M46089	Caribbean Crescent Inc.	Baltimore	MD	-76.66	39.267
M46090	Big Sky Processing, LLC	Moore	MT	-109.694	46.977
M46093	B & C Seafood, Inc.	Vacherie	LA	-90.623	29.919
M46094	Fresh Water Seafood	Loreauville	LA	-91.738	30.061
M46099	West End Fresh Salads, LLC	Tupelo	MS	-88.701	34.204
M46103	Blue Ridge Meats	Rabun Gap	GA	-83.358	34.971
M46108	Bovine and Swine	Jackson	WY	-110.798	43.463
M4611	Hudson Foods Venture, LLC	Hudson	NY	-73.792	42.258
M46111	Kroll Farms Inc.	New Windsor	NY	-74.096	41.458
M46123	Max's Kitchen LLC	Modesto	CA	-120.983	37.611
M46125	California Rice Center Inc.	Gardena	CA	-118.314	33.879
M46126	The Bait Shop	Lettsworth	LA	-91.794	30.973
M46127	DBA Clark Brothers Quality Meats	Roanoke	AL	-85.404	33.162
M46131	Maui Crisps	Wailuku	HI	-156.497	20.854
M46132	Seven Hills Food LLC	Arcadia	CA	-118.008	34.101
M46139	Cypress Valley Meat Company	Pottsville	AR	-93.049	35.255
M46140	Reliant Fish Co.	Jessup	MD	-76.781	39.16
M46141	Virginia Live Fish Co.	Chester	VA	-77.37	37.345
M46145	Baya Halal Meats, LLC	Doylesburg	PA	-77.745	40.202
M46146	Ben's Best LLC	Bradenton	FL	-82.31	27.424
M46154	Mohn Fish Market	Harpers Ferry	IA	-91.127	43.232
M46159	Columbus Meats, Inc.	Chicago	IL	-87.73	41.812
M46160	Thompsons Meats Inc.	Tooele	UT	-112.339	40.531
M46162	River Bear American Meats	Denver	CO	-104.953	39.77
M46169	Good To-Go, Inc.	Kittery	ME	-70.712	43.126
M46170	Quapaw Food Services Authority	Miami	OK	-94.804	36.919
M46172	JM Watkins, LLC	Maiden Rock	WI	-92.264	44.654
M46176	May's Custom Meat Processing LLC	Mill Run	PA	-79.434	39.942
M46178	Northwest Gourmet Food Products, Inc.	Renton	WA	-122.226	47.474
M46180	World of Pies LLC	Norcross	GA	-84.209	33.936
M46184	Steve & Laura, LLC	Wayland	MI	-85.646	42.74
M46185	Detweiler Meats LLC	Crofton	KY	-87.487	37.047
M46187	Uncle Johnny's Wholesale Catfish	Vance	SC	-80.448	33.397
M46194	Piazza Produce LLC, d/b/a Cibus Fresh	Noblesville	IN	-86.007	40.013
M46200	Caledonia Packing LLC	Caledonia	MI	-85.568	42.797
M46203	Del Fox Custom Meats Inc.	Bow	WA	-122.458	48.518
M46205	Dakota Provisions - West	Huron	SD	-98.253	44.366
M46222	Fresh Halal Meat LLC	Cuba	MO	-91.371	38.078
M46223	SunOpta Foods, Inc.	Allentown	PA	-75.616	40.592
M46227	Nicola's Pasta Fresca, LLC	Kenilworth	NJ	-74.28	40.669
M46230	Greenfield Foods Corporation	Algona	WA	-122.247	47.293
M46231	Del Rey Meat & Seafood, Inc.	Anaheim	CA	-117.882	33.816
M46233	University of Wisconsin River Falls	River Falls	WI	-92.623	44.855
M46234	Okeechobee Fish Co LLC	Okeechobee	FL	-80.857	27.172
M46235	His Meat Company	Marshfield	WI	-90.179	44.631
M46236	F & S Fresh Foods	Conley	GA	-84.318	33.637
M46240	Light Hill Meats, LLC	Lynnville	TN	-86.97	35.383
M46242	El Campestre Inc.	Compton	CA	-118.215	33.884
M46243	S.D.J. Trading Inc.	Irvington	NJ	-74.25	40.721
M46247	North Country Charcuterie dba Foris Extraordinary Meats	Columbus	OH	-83.037	39.992
M46248	Slagel Family Meats, Inc.	Forrest	IL	-88.412	40.75
M4625	Ford Brothers Wholesale Meats Inc	West Valley	NY	-78.678	42.398
M46250	Lou G Siegel	Brooklyn	NY	-73.954	40.724
M46255	Gemstone Ventures dba RCF, LLC or Gemstone Foods	Florence	AL	-87.669	34.795
M46256	Snack Hui Ventures LLC	Phoenix	AZ	-112.056	33.407
M46257	Mo's Chowder Vault	Astoria	OR	-123.827	46.19
M46259	Taylor Farms Retail, Inc.	Gonzales	CA	-121.446	36.503
M46260	Meat Masters Processing Co.	Stockton	IL	-90.002	42.347
M46262	BillyDoe Meats, Inc.	Hoffman Estates	IL	-88.139	42.062
M46264	Link Snacks Inc.	Minneapolis	MN	-93.275	44.979
M46277	Brite Start, LLC.	Altura	MN	-91.942	44.07
M46281	Winly Foods LLC	Henderson	TX	-94.797	32.168
M46288	Kerry	Clark	NJ	-74.319	40.628
M4629	Isabelle's Kitchen, Inc.	Harleysville	PA	-75.383	40.277
M46292	Off the Rail Butchery	Blair	NE	-96.136	41.546
M46293	South Florida Food LLC	Hollywood	FL	-80.203	25.998
M46297	Lockhart Meat Company	Jackson	WY	-110.737	43.369
M46298	United Foods Corporation	Chicago	IL	-87.646	41.825
M46299	Pegasus Foods Inc.	Rockwall	TX	-96.425	32.913
M46300	Center for Advancement of Meat Production and Processing	Iowa	LA	-92.938	30.245
M46301	Wagon Meats	El Paso	TX	-106.461	31.773
M46308	VT Pie and Pasta Co.	Newport	VT	-72.168	44.951
M46312	Leroy Meats	Fox Lake	WI	-88.921	43.567
M46312B	Leroy Meats	Horicon	WI	-88.639	43.444
M46315	Fulcher's Seafood	Alliance	NC	-76.786	35.142
M46316	Harvesters - The Community Food Network	Kansas City	MO	-94.515	39.055
M46320	Reser's Fine Foods, Inc.	Topeka	KS	-95.615	39.046
M46321	Curt's Pork Skins	Breman	GA	-85.102	33.742
M46324A	Morning Star Poultry	Fort Plain	NY	-74.67	42.884
M46327	CF THK, LLC	Houston	TX	-95.325	29.704
M46334	Plymouth Meats, LLC	Terryville	CT	-73.022	41.689
M46336	Pioneer Meats, Inc.	Big Timber	MT	-109.918	45.838
M46337	Lepe's Meat Company Inc.	Santa Rosa	CA	-122.724	38.388
M46339	Tejas Premium Meats, LLC	Itasca	TX	-97.198	32.208
M46340	The Meat Market	Baraboo	WI	-89.72	43.472
M46341	HPP Food Services	Wilmington	CA	-118.276	33.772
M46344	JBS USA	Mason	OH	-84.303	39.374
M46345A	Henry Broch Foods	Waukegan	IL	-87.889	42.394
M46347A	Decko Products, Inc.	Sandusky	OH	-82.744	41.436
M46349	Cordele Cold Storage & Food Processing, LLC	Cordele	GA	-83.74	31.969
M46351	Meatworks	Westport	MA	-71.103	41.67
M46352	Kalaheo Jerky Co. LLC	Honolulu	HI	-157.873	21.321
M46353	Antonio Mozzarella Factory	Newark	NJ	-74.198	40.7
M46354	Cruse Meat Processing, LLC.	Concord	NC	-80.482	35.481
M46360	Connie's Pizza	Chicago	IL	-87.675	41.847
M46365	HB Foods, LLC	Lakewood	WA	-122.49	47.168
M46367	Raybern Foods LLC	Shannon	MS	-88.699	34.171
M46368	George Nottoli & Son	Chicago	IL	-87.819	41.938
M46373	Cargill Kitchens Solutions, Inc.	Big Lake	MN	-93.716	45.333
M4638	Warsaw Packing Co.	Warsaw	NY	-78.129	42.701
M46381	The Vons Companies, Inc.	March Air Reserve Base	CA	-117.281	33.9
M46384	LaRuche Imports, Inc.	Houston	TX	-95.54	29.672
M46387	JNP Hawaii LLC	Honolulu	HI	-157.887	21.326
M46391	Bills Market, Inc.	Romulus	NY	-76.828	42.808
M46394	Wayne Farms LLC	Decatur	AL	-87.043	34.612
M46395	Biltong Beef Products LLC	Seattle	WA	-122.313	47.667
M46396	NutriFresh HPP Services LLC	Edison	NJ	-74.391	40.535
M46397	Bakkavor Foods USA, Inc - Charlotte Breads	Charlotte	NC	-80.948	35.115
M4640	Davis Bros. Inc.	Oswego	NY	-76.468	43.446
M46407	ORB CCM Holding, LLC	Gordon	NE	-102.205	42.8
M46408	Crystal Springs Meat Co.	Klamath Falls	OR	-121.748	42.2
M46411	Pacific Fresh Premium Meat	Tacoma	WA	-122.434	47.25
M46419	Fitch Ranch Artisan Meat Company	Craig	CO	-107.543	40.507
M46421	Jack Mountain Meats LLC	Burlington	WA	-122.333	48.474
M46427	Rudy's Meat Provisioners, LLC	Portland	OR	-122.603	45.526
M46432	KD Latin Food Inc	Hialeah	FL	-80.292	25.838
M46433	Ida Meats LLC	Rupert	ID	-113.685	42.602
M46434	Wahoo Locker LLC	Wahoo	NE	-96.622	41.21
M46435	First Street Cafe	Phoenix	OR	-122.816	42.274
M46437	Najla's Speciality Foods, Inc.	Louisville	KY	-85.608	38.261
M46442	Tejas Meat Processors	Houston	TX	-95.347	29.695
M46445	Bakkavor US - San Antonio	San Antonio	TX	-98.403	29.482
M46448	Forum Meat Company	Ennis	TX	-96.617	32.31
M46449	Doyle's Fish Market	Linden	TN	-87.983	35.763
M46455	Eden View Farms LLC	Trenton	TX	-96.379	33.405
M46456	MawMaw's Chicken Pies	Kernersville	NC	-80.06	36.119
M46461	Global Gourmet Food Solutions LLC	Garland	TX	-96.691	32.902
M46462	LINKO FOOD LLC	SOUTH SAINT PAUL	MN	-93.026	44.868
M46463	Food Crafters, LLC	Florida	PR	-66.566	18.363
M46469	Capitol Concessions LLC	San Antonio	TX	-98.415	29.43
M46471	Tubito's Pizza, LLC	Oakland Park	FL	-80.142	26.173
M46475	Kurzweils Country Meats	Garden City	MO	-94.249	38.594
M46479	Fisher Packing Company	Redkey	IN	-85.166	40.345
M46481	Integra Foods, LLC	Bladenboro	NC	-78.774	34.554
M46483	Stormberg Foods LLC	Goldsboro	NC	-77.943	35.385
M46483A	Stormberg Foods LLC	Goldsboro	NC	-77.922	35.368
M46491	WholeStone Farms Cooperative, Inc.	Fremont	NE	-96.486	41.422
M46494	Magnolia Food Co., LLC	North Haven	CT	-72.868	41.343
M46498	Westminster Meat Packing, Inc.	Westminster	VT	-72.46	43.093
M46499	East West LLC	Landover	MD	-76.858	38.939
M465	MG Foods	Charlotte	NC	-80.948	35.125
M46507	US Cold Storage	McDonough	GA	-84.155	33.393
M4651	LaFrieda Meats Inc.	North Bergen	NJ	-74.038	40.78
M46514A	Love Snacks, LLC	Winter Garden	FL	-81.568	28.549
M46515	Vicky Enterprises, Inc.	Medley	FL	-80.316	25.843
M46516	Stryker Farm LLC	Saylorsburg	PA	-75.33	40.863
M46517	Gabriele Properties Holding LLC	Scotia	NY	-73.968	42.827
M4651A	LaFrieda Meats Inc.	North Bergen	NJ	-74.037	40.782
M4652	George E. Assadourian Inc.	Fairview	NJ	-73.994	40.818
M46521	Barrett's Smokehouse	Portage	MI	-85.615	42.172
M46522	Del Real Foods, LLC	Moore	OK	-97.484	35.347
M46523	NCF Foods, LLC	Marne	MI	-85.816	43.04
M46525	JD Meat Market	Bronx	NY	-73.925	40.842
M46527	Artisan Kitchens, LLC	Newberry	SC	-81.631	34.281
M4653	A.A. Rubashkin & Sons	Brooklyn	NY	-73.987	40.637
M46530	Voung Dim Sum Corporation	Doraville	GA	-84.27	33.897
M46535	Blanche Farms Specialty Cured Meat	Macon	GA	-83.805	32.95
M46536	Foodz Depot Inc	Garden City	MI	-83.365	42.331
M46537	Felito's Finest LLC	Santa Elena	TX	-98.541	26.597
M46538	Family Traditions Meat Company, Inc.	Ackley	IA	-93.058	42.557
M4653A	Agri Star Meat and Poultry, LLC	Postville	IA	-91.581	43.088
M46544	E.A. Sween Company	Annandale	MN	-94.1	45.255
M46549	Buttermilk Pie Company, LLC	Gainesville	GA	-83.842	34.282
M46552	Reel Cajun Foods	Baton Rouge	LA	-91.182	30.465
M46553	Erie Bone Broth, LLC	Cleveland	OH	-81.678	41.508
M46563	madinatraders mar	Burr Ridge	IL	-87.939	41.74
M46564	Wayne's Country Hams	Statesville	NC	-80.881	35.854
M46575	Slab Factory of Plano, LLC	Plano	TX	-96.705	33.024
M46578	Ram Country Meats	Fort Collins	CO	-105.082	40.572
M46579	Pelmeni Princess	Tahlequah	OK	-94.974	35.9
M4657A	Sun Ming Jan Inc.	Brooklyn	NY	-73.931	40.703
M46581	Richard's Cajun Foods	Church Point	LA	-92.203	30.412
M46583	McLane Classic Foods	Burleson	TX	-97.266	32.472
M46584	The Lamb Co-operative Inc.	Pedricktown	NJ	-75.411	39.74
M46585	Leader Meat Packing Corp.	Chesterfield	NJ	-74.631	40.07
M46586	Gambino's Italian Eatery	Stratford	NJ	-75.006	39.835
M46588	The Jambalaya Shoppe Smokehouse	Gonzales	LA	-90.902	30.211
M46591	Five Star Breaktime Solutions	Lafayette	GA	-85.276	34.736
M46594	DTF Prep Seattle, LLC	Seattle	WA	-122.335	47.567
M46603	Gold Creek Foods LLC/Gold Creek Processing LLC	Gainesville	GA	-83.859	34.269
M46606	Pineland Farms Natural Meats	New Gloucester	ME	-70.262	43.908
M46607	Fresh Express Incorporated	Morrow	GA	-84.347	33.562
M46612	Midwest Kitchens	Kenosha	WI	-87.893	42.591
M46616	Tudo Bom LLC	Elizabeth	NJ	-74.213	40.669
M46617	Tusan Commodities Inc	Lake City	GA	-84.343	33.61
M46619	Ke'Fruits llc	Carolina	PR	-65.97	18.381
M4662	Piatkowski Riteway Meats Inc.	Niagara Falls	NY	-79.015	43.129
M46622	920 Fries Frozen Foods, LLC	Millen	GA	-81.949	32.794
M46622A	920 Fries Frozen Foods	Millen	GA	-81.949	32.794
M46624	Kibberia Foods LLC	Danbury	CT	-73.421	41.388
M46624A	Kibberia Foods LLC	Danbury	CT	-73.421	41.412
M46625	Los Mejores Tamales Production Corp.	Hialeah	FL	-80.262	25.848
M46633	The Steel Buffalo Butchery	Dawsonville	GA	-84.01	34.392
M46635	Quality Meat, Inc.	Aberdeen	ID	-112.835	42.949
M46637	Catskill Food Company LLC	Delhi	NY	-74.919	42.275
M46638	Taylor Farms New England Inc.	North Kingstown	RI	-71.44	41.605
M46644	Yellow Bowler Hat LLC	Spring	TX	-95.437	30.128
M46648	Amish Country Bakehouse	Carlisle	PA	-77.178	40.204
M46654	Rovira Biscuit Corporation	Ponce	PR	-66.574	18.021
M46655	Bama Companies, Inc.	Tulsa	OK	-95.95	36.148
M46656	Attala Frozen Foods	Kosciusko	MS	-89.601	33.055
M46661	Miesfeld's Market	Sheboygan	WI	-87.771	43.798
M46662	Great Lakes Cheese Company, Inc. - Wausau, WI	Wausau	WI	-89.764	44.964
M46666	Maryland Packaging LTD	Halethorpe	MD	-76.675	39.254
M46668	Vermont Salumi	Barre	VT	-72.503	44.199
M46673	Triple Sticks Foods LLC	Belleville	IL	-90.056	38.574
M46684	Yushang Food Inc.	Spartanburg	SC	-81.968	34.915
M46689	Custom Cut Solutions	Albertville	AL	-86.184	34.255
M46690	Market House Meats	Northfield	MN	-93.291	44.505
M46691	Traditional Snacks	Hialeah Gardens	FL	-80.37	25.891
M46692	Trans-Packers Services Corp.	Piscataway	NJ	-74.437	40.563
M46693	United Fruit and Produce Co.	St. Louis	MO	-90.191	38.652
M46693A	United Fruit and Produce Co.	St. Louis	MO	-90.189	38.653
M46696	American Country Foods, Inc.	Plainfield	CT	-71.88	41.686
M46697	Miami Desserts Corp.	Hialeah	FL	-80.333	25.896
M46700	Cargill Meat Solutions Corporation	Camp Hill	PA	-76.932	40.212
M46706	Northeast Kingdom Processing LLC	St. Johnsbury	VT	-72.014	44.498
M46707	Hartland Abattoir Corp	Gasport	NY	-78.585	43.24
M46719A	New England Charcuterie, LLC	Waltham	MA	-71.199	42.384
M46723	Romano's Originals, LLC	Newtown Square	PA	-75.438	39.977
M46728	VSU's Small Ruminant Mobile Meat Processing Lab	Petersburg	VA	-77.442	37.233
M46730	NGF Processing, LLC	Petal	MS	-89.106	31.237
M46734	Davis Meat Processing LLC	Jonesburg	MO	-91.297	38.861
M46737	Total Product Distributor Inc.	Brooklyn	NY	-73.917	40.642
M46739	Hepler Meats	Emlenton	PA	-79.654	41.274
M46740	Verde Farms, LLC	Pedricktown	NJ	-75.411	39.74
M46743	Craftology, LLC dba Dutch Treat Foods	Zeeland	MI	-85.984	42.828
M46747	Ye Olde Kings Head, Inc.	Calabasas	CA	-118.639	34.158
M46758	US Quality Meats, LLC	El Paso	TX	-106.47	31.764
M46766	GC Food Factory LLC	Miami	FL	-80.315	25.796
M46767	Pott's Meats	Wartrace	TN	-86.312	35.531
M46769	We're The Wurst	Redmond	OR	-121.168	44.259
M46771	Cavo Greco Foods	East Meadow	NY	-73.556	40.711
M46777	Bob's Processing Inc.	South Haven	MI	-86.232	42.36
M46780	Michael Foods Egg Products Company	Norwalk	IA	-93.689	41.462
M46783	Chan and Chan USA, LLC	Bethlehem	PA	-75.428	40.65
M46785	Mama Lycha Foods, LLC	Houston	TX	-95.412	29.987
M46787	Master Food	Chicago	IL	-87.642	41.822
M46788	Southeastern Mills, Inc.	Rome	GA	-85.199	34.17
M46794	Main Processing LLC	Detroit	TX	-95.266	33.662
M46795	Yaman Halal Meats Inc.	Savoy	TX	-96.291	33.581
M46798	Century Frozen Foods	Canovanas	PR	-65.9	18.372
M46808	Superior Sausage, LLC	District Heights	MD	-76.868	38.847
M46809	P & J Meat Market Corp	Newark	NJ	-74.178	40.718
M46810	International Blessed Foods, Inc.	Winston-Salem	NC	-80.264	36.071
M46815	Cook Out, Inc	Greensboro	NC	-79.801	36.03
M46816	Depalo Foods, Inc.	Belmont	NC	-81.055	35.268
M46818	World Class Kitchens-Freehold	Freehold	NJ	-74.24	40.251
M46819	Island Bwoy Cuisine, LLC.	Temple Hills	MD	-76.94	38.824
M46822	Mitchell's Meat Processing, LLC.	Walnut Cove	NC	-80.145	36.297
M46822A	Mitchell's Butchery, Inc	Walnut Cove	NC	-80.181	36.367
M46824	Fresh Halal Meat, Inc.	Lexington	NC	-80.199	35.765
M46828	Dean Street Processing	Bailey	NC	-78.104	35.778
M4683	Loke Enterprises, Inc.	King of Prussia	PA	-75.35	40.087
M46830	Mrs. Pumpkins Muffin's Inc.	Winston-Salem	NC	-80.318	36.159
M46833	Express Transfer and Trucking	Pennsauken	NJ	-75.053	39.97
M46834	Nuchas, LLC	North Bergen	NJ	-74.022	40.791
M46835	Megas Yeeros, LLC	Lyndhurst	NJ	-74.098	40.801
M4684	Whiteman Meat Processing	Dansville	NY	-77.706	42.562
M46841	Lakeside Refrigerated Services	Swedesboro	NJ	-75.376	39.75
M46847	Baker, Inc.	Mt. Jackson	VA	-78.671	38.821
M46849	Caribbean Breeze Frozen Foods Corp.	Pemberton	NJ	-74.687	39.969
M46850	Deluxe Foods International, Inc.	Paterson	NJ	-74.144	40.938
M46851	SLM Gyro & Donor, LLC	Springfield	NJ	-74.306	40.712
M46853	White Oak Meats, LLC	Shady Spring	WV	-81.08	37.698
M46859	Mickenzie Jerky, Inc.	Hope Mills	NC	-78.963	34.983
M4686	Arctic Foods USA, LLC	Washington	NJ	-74.97	40.76
M46867	A & G Food Service LLC	Little Silver	NJ	-74.038	40.325
M46870	Butterball, LLC	Raeford	NC	-79.209	34.976
M46873	Quality Foods From The Sea	Elizabeth City	NC	-76.21	36.312
M46876A	Latin Goodness Foods	Rockville	MD	-77.142	39.098
M46877	Seven Hills Abattoir	Lynchburg	VA	-79.152	37.398
M46888	Djerdan Burek Corp	South Hackensack	NJ	-74.049	40.869
M46893	CLASSIC SEAFOOD GROUP, INC.	AYDEN	NC	-77.431	35.447
M46894	MAGNOLIA BEEF HOLDINGS LLC	HASBROOK HEIGHTS	NJ	-74.071	40.85
M46896	MURRAY L. NIXON FISHERY INC	EDENTON	NC	-76.717	36.202
M46898	J.J. MCDONNELL & CO., INC	Elkridge	MD	-76.767	39.178
M46899	L. D. AMORY AND COMPANY, INC	HAMPTON	VA	-76.343	37.024
M469	Boyle's Famous Corned Beef (2024), LLC	Kansas City	MO	-94.606	39.102
M46904	ARO Foods, LLC	Houston	TX	-95.465	30.004
M46909	S & J Food Sales LLC	Frederick	OK	-99.014	34.406
M4691	Hartford West Indian Bakery, Inc.	Hartford	CT	-72.67	41.79
M46910	B & R Meat Processing	Winslow	AR	-94.143	35.809
M46911	Cut Fruit Express, Inc	Inver Grove Heights	MN	-93.037	44.782
M46913	Nurture Life, Inc.	Bedford Park	IL	-87.794	41.773
M46915	Ali's Meats, L.L.C.	Stone Mountain	GA	-84.119	33.824
M46919	J'S & A'S Food Inc	Memphis	TN	-89.893	35.149
M4692	Latina Boulevard Foods, LLC	Cheektowaga	NY	-78.75	42.871
M46924	Brick House Pizza Co.	Florissant	MO	-90.32	38.791
M46926	Samossa Bites	Long Island City	NY	-73.929	40.757
M46940	Jackiscooking LLC	Ancramdale	NY	-73.569	42.067
M46942	Maple Wind Farm	Richmond	VT	-72.97	44.41
M46944	Bostrom Farms, LLC	Stanley	NY	-77.104	42.858
M46945	Pane Vita LLC	Rochester	NY	-77.624	43.167
M46953	Fresh Advantage / Demakes Enterprises, LLC	Danvers	MA	-70.975	42.577
M46954	Premier Meat Processing LLC	Astoria	NY	-73.936	40.759
M46959	Brugusa LLC	North Miami Beach	FL	-80.16	25.918
M46965	Dinners On The Porch, LLC	Winston-Salem	NC	-80.245	36.082
M46966	Encore Sausage Company	Hyattsville	MD	-76.887	38.933
M46968	ICON Meals	Farmers Branch	TX	-96.835	32.928
M46970	307 Meat Company	Laramie	WY	-105.586	41.282
M46977	Marjo's Delight	Dededo	GU	144.833	13.506
M46978	Hitman Smoked Products, LLC	Clifton	TN	-87.999	35.384
M46979	West Coast Prime Meats, LLC	Brea	CA	-117.917	33.921
M46981	Andre's & Lana's Delicacies	Lakewood	CO	-105.11	39.71
M46987	F&S Produce West LLC	Clackamas	OR	-122.562	45.401
M46993	Stamboom	Hood River	OR	-121.595	45.634
M46996	305 Pizza @ MIA LLC	Miami	FL	-80.253	25.808
M46997	Nepaley LLC	Chicago	IL	-87.779	41.916
M47010	Julias Columbian Food	Lilburn	GA	-84.137	33.895
M47014	Husker Meats LLC	Ainsworth	NE	-99.852	42.554
M47015	AHR Manufacturing Inc	Hialeah	FL	-80.293	25.846
M47021	K&J Meat Processing, LLC	Paris	TN	-88.371	36.307
M47022	Alba Foods LLC	Houston	TX	-95.403	29.848
M47026	Gallucci's Fine Foods Inc.	Danbury	CT	-73.434	41.389
M47028	Midsouth Packers, LLC	Forsyth	GA	-83.954	32.968
M47029	DeBacker Family Dairy	Daggett	MI	-87.553	45.444
M47030	F & C Seafood	Raceland	LA	-90.606	29.711
M47031	Empire Custom Processing, LLC	Bridgewater	NY	-75.25	42.884
M47032	Heart O' Lakes Quality Meats	Pelican Rapids	MN	-96.086	46.584
M47033	Salsabil Meat Processing	Nelliston	NY	-74.61	42.927
M47035	ZK Ranches	Springfield	TN	-86.854	36.493
M47036	Andoro LLC	St. Louis	MO	-90.189	38.653
M47037	Quality Steak Inc.	Voorhees	NJ	-75.011	39.852
M47039	QC Poultry	Montebello	CA	-118.114	34.007
M47043	Aliyans Global, Inc.	Franklin Park	IL	-87.854	41.919
M47046	Abuelito Corn Inc.	Butler	NJ	-74.341	41.003
M47048	Beck's Sinclair's Fresh Fish & Seafood Market	Paris	TN	-88.223	36.354
M47049	Lifestyle Foods Inc.	Hanover	PA	-76.953	39.823
M47051	I O Ranch Processing, LLC	Evant	TX	-98.149	31.484
M47052	Potts Family Meats	Jefferson	GA	-83.51	34.138
M47056	TC Provisions, Inc.	Farmingdale	NY	-73.452	40.728
M47059	CYRE, Inc., DBA Pika's Farm Table	Lake Katrine	NY	-73.994	41.988
M47061	Del Caribe Meat, Inc	Bronx	NY	-73.909	40.831
M47064	Co-Man of GA	Cumming	GA	-84.109	34.228
M47065	New Horizon Food, Inc.	Lorton	VA	-77.184	38.736
M47069	United Meat Market	El Paso	TX	-106.472	31.758
M47070	IPMF, LLC., d/b/a Naturpak	Janesville	WI	-89.013	42.633
M47071	J.C. Sowell Meats Inc.	Vidalia	GA	-82.446	32.143
M47072	Craft Byte LLC.	Wimauma	FL	-82.33	27.756
M47077	The Daily Jerky	Albuquerque	NM	-106.533	35.096
M47079	Tribal Meat LLC	Milo	IA	-93.441	41.287
M47081	Taylor Farms Tennessee North	Covington	KY	-84.525	39.019
M47082	Tawa Services, Inc.	Buena Park	CA	-118.021	33.867
M47086	1923 Chili	New Castle	PA	-80.356	41.037
M47087	Alexis Wholesale Distribution Inc.	Gardena	CA	-118.304	33.902
M47090	Pupusas San Miguel, LLC	Waller	TX	-95.934	30.056
M47092	MainLine Foods LLC	Marietta	GA	-84.493	33.914
M47095	Hess Meat Market Inc.	Muenster	TX	-97.368	33.654
M47096	Tampasta LLC	Clearwater	FL	-82.695	27.87
M47097	B'ALL Foods LLC	Opa Locka	FL	-80.252	25.892
M471	Bar-S Foods Co.	Clinton	OK	-98.962	35.51
M47104	Fort Worth Meat Packers LLC	Fort Worth	TX	-97.348	32.812
M47104B	Fort Worth Meat Packers LLC	Fort Worth	TX	-97.348	32.812
M47107	JD's House of Bacon, Inc.	Baltimore	MD	-76.521	39.299
M47108	Lil Smokehouse, LLC	Hattiesburg	MS	-89.324	31.298
M47108A	Lil Smokehouse, LLC	Hattiesburg	MS	-89.322	31.299
M47112	Crunch Pak	Cashmere	WA	-120.472	47.521
M47126	High Country Meats	Raton	NM	-104.446	36.884
M47127	Agricola Meats, LLC	New Haven	VT	-73.176	44.087
M47128	La Salumina LLC	Hurleyville	NY	-74.674	41.736
M47129	3 Fish, Inc	Gastonia	NC	-81.192	35.29
M47133	Produce Innovations	Norwalk	IA	-93.668	41.493
M47136	Batchline Solutions	Westampton	NJ	-74.848	40.017
M47137	LSG Sky Chefs	Coraopolis	PA	-80.235	40.496
M47138	GA ZABIHA FARMS Inc.	Braselton	GA	-83.757	34.129
M47142	Hempstead Foodservice Inc.	Hempstead	NY	-73.629	40.703
M47145	Vanacor Sea Food LLC	Des Allmends	LA	-90.457	29.834
M47146	K&K International Inc.	Torrance	CA	-118.311	33.845
M47148	Bud Antle	Soledad	CA	-121.356	36.457
M47150	A Peach of a Party	Roswell	GA	-84.358	34.02
M47151	Crowes Butcher Shop	Henagar	AL	-85.692	34.692
M47153	Ruga Rue Meat Snax, LLC	Altoona	PA	-78.404	40.469
M47154	Northwest Frozen	Des Moines	WA	-122.306	47.411
M47156	By The Pound Catering Corp.	Hialeah	FL	-80.288	25.848
M47158	Lawlers Southern Foods III LLC	Ardmore	AL	-86.866	34.98
M47161	Northern Wind, LLC	Fall River	MA	-71.12	41.746
M47162	Punto Rojo Empanadas Corp.	Hempstead	NY	-73.623	40.707
M47163	Moja Domacica, INC.	Buffalo Grove	IL	-87.941	42.16
M47164	Salm Partners, LLC	Denmark	WI	-87.839	44.342
M47165	Lopez Foods, Inc.	Cherokee	IA	-95.562	42.73
M47167	Elburn Market, Inc. dba Ream's Meat Market	Elburn	IL	-88.473	41.89
M47170	Simply Fresh Market, LLC	Marietta	GA	-84.414	33.95
M47171	Fishtail Food Distributing	Fishtail	MT	-109.504	45.453
M47172	FBS Hudson	Hudson	WY	-108.59	42.901
M47175	United Custom Foods, LLC	Lucama	NC	-78.013	35.591
M47181	Quality Cut Meats	Cascade	WI	-88.011	43.655
M47186	Cloud's Meats Inc.	Carthage	MO	-94.346	37.153
M47188	Pap's Processing LLC	Louisville	KY	-85.752	38.179
M47192	OFD Foods, LLC	Albany	OR	-123.107	44.618
M47194	Colorado Lamb Processors	Brush	CO	-103.625	40.258
M47196	Waldron Custom Meats	New Milford	PA	-75.796	41.867
M47197	Belen De La Cruz- Empanadas	Johns Creek	GA	-84.212	34.066
M47200	Star Valley Meat Block	Thayne	WY	-111.003	42.92
M47210	Marzolf Meats LLC	Snohomish	WA	-122.125	47.929
M47213	MELONE BROTHERS INC	Staten Island	NY	-74.14	40.631
M47214	GW BEEF COMPANY LLC	Washington	OK	-97.478	35.106
M47216	In't Veld's Meat Market	Pella	IA	-92.916	41.407
M47219	Nichirei Sacramento Foods Corporation	West Sacramento	CA	-121.562	38.55
M4722	Nodine's Smokehouse, Inc.	Torrington	CT	-73.111	41.794
M47223	Cutting Edge Meat Company LLC	Leakesville	MS	-88.593	31.189
M47224	West Forty Market, LLC	Mechanicsville	MD	-76.775	38.431
M47227B	Clean Chickens and Co., LLC	Willmar	MN	-95.088	45.117
M47228	Riverson Foods, Inc.	City of Industry	CA	-117.926	34.001
M47233	Bessie's Inc.	Fairborn	OH	-84.008	39.838
M47236	RH Meat Company	Paramount	CA	-118.17	33.891
M47237	JSL Foods, Inc.	Los Angeles	CA	-118.192	34.058
M47238	Modu Food Service, Inc.	Vernon	CA	-118.2	33.997
M4723A	Chinamerica Food Manufacture, Inc.	Boston	MA	-71.067	42.33
M47240	Hormel Foods Operations, LLC	Papillion	NE	-96.125	41.153
M47243	Rocky Mountain General Store & Custom Meats	Bayfield	CO	-107.557	37.429
M47247	Luckey Hospitality, LLC	Nashville	TN	-86.88	36.187
M47248	Bluegrass Lamb Company, LLC	Glendale	KY	-85.858	37.615
M47251	Genuine Meats LLC	Riverton	WY	-108.453	43.056
M47257	Cut Rite Outback LLC	Vero Beach	FL	-80.488	27.563
M47258	Cargill Meat Solutions Corporation	North Kingstown	RI	-71.463	41.603
M4726	DeLattre's Pizza	Houtzdale	PA	-78.408	40.832
M47261	Nordik Meats Inc	Viroqua	WI	-90.888	43.612
M47262	Wisconsin's Best	Oregon	WI	-89.362	42.918
M47263	Freshpoint Bix Produce Company, LLC	Little Canada	MN	-93.085	45.033
M47264	New Mexico's Best, LLC	Roswell	NM	-104.524	33.374
M47265	JBS Prepared Foods-Moberly Facility	Moberly	MO	-92.439	39.451
M47266	Prime Nosh LLC	North Las Vegas	NV	-115.185	36.196
M47267	Birdsboro Kosher Provisions LLC	Newark	NJ	-74.141	40.729
M47270	Midwest Smoked Meats, LLC	Chicago	IL	-87.767	41.975
M47273	Prairie Meats, Inc.	Olivia	MN	-95.023	44.777
M47275	Lapids Korner, Inc.	Los Angeles	CA	-118.218	34.079
M47282	Top Notch Jerky LLC	Sugar City	ID	-111.753	43.878
M47285	Green Valley Foods	Devils Lake	ND	-98.873	48.095
M47287	Project Meats LLC	Billings	MT	-108.358	45.902
M47287A	Ranch House Snacks	Billings	MT	-108.433	45.804
M47288	Road 39 Ranch Meats, LLC	Mancos	CO	-108.344	37.31
M47289	Barnard Processing	Barnard	MO	-94.825	40.175
M47294	Watauga Meats and Butchery	Vilas	NC	-81.764	36.262
M47297	Cuisine Solutions	San Antonio	TX	-98.429	29.34
M47299	Gibson's Custom Butchering, LLC	Hughesville	PA	-76.622	41.288
M47300	Fairway Market Distribution Center	Bronx	NY	-73.906	40.805
M47307	Shahs Halal New Horizons Processing, Inc.	Amityville	NY	-73.396	40.705
M47308	Wilde Brands	Winchester	KY	-84.216	38.015
M47308R	Wilde Brands	Winchester	KY	-84.191	38.013
M47309	Chef's Warehouse Midatlantic , LLC	Jessup	MD	-76.784	39.164
M47311	Captain Reds, Inc.	Vernon	CA	-118.235	33.997
M47315	Burrito Bro's	Centralia	WA	-122.956	46.695
M47316	Peer Foods - Edinburgh	Edinburgh	IN	-85.957	39.313
M47318	Driftless Provisions, LLC	Viroqua	WI	-90.887	43.572
M47320	Central Wyoming College	Riverton	WY	-108.423	43.036
M47321	King Ge, LLC	Tukwila	WA	-122.248	47.45
M47322	Positive Food Co.	Los Angeles	CA	-118.263	33.984
M47323	Natures Way Food Corp	Bronx	NY	-73.887	40.807
M47326	Creation Gardens	Denver	CO	-104.991	39.789
M47330	Best Stop Cajun Food, LLC	Scott	LA	-92.109	30.261
M47333	Three Lakes Ranch	Knoxville	GA	-83.945	32.698
M47336	Godshall's Quality Meats, Inc.	Souderton	PA	-75.356	40.28
M47343	Jallos LLC	Marysville	WA	-122.176	48.118
M47344	Quality Seafood & Poultry, Inc.	Biloxi	MS	-88.892	30.403
M47350	B&G Pacific, LLC	Tamuning	GU	144.782	13.496
M47358	SSI Foods LLC	Amarillo	TX	-101.722	35.236
M47359	Main Street Catering	Jonesborough	TN	-82.469	36.294
M47366	Missouri Prime Beef Packers, LLC	Pleasant Hope	MO	-93.269	37.477
M47368	10,000 Lakes Beef, Inc	Buffalo Lake	MN	-94.599	44.732
M47369	JMF Slaughter (Mobile Unit)	Petaluma	CA	-122.871	38.296
M47379	Old Country Jerky	Lynbrook	NY	-73.672	40.655
M47386	Corfini Gourmet	Brisbane	CA	-122.417	37.689
M4739	RC Fine Foods	Hillsborough	NJ	-74.642	40.495
M47390	Millenia Foods LLC	Orlando	FL	-81.372	28.469
M47395	J-Bar Meat Company	San Angelo	TX	-100.434	31.38
M47396	Eat Catering Concepts, LLC	Duluth	GA	-84.165	34.016
M474	Palmyra Bologna Company, Inc.	Palmyra	PA	-76.599	40.31
M47402	Avatar Foods, Inc.	Henderson	NV	-114.958	36.016
M47404	Meat & Dough Foods LLC	Schaumburg	IL	-88.061	42.067
M47405	Savello USA, Inc.	Hanover Township	PA	-75.934	41.226
M47406	Mutual Trading Co., Inc.	El Monte	CA	-118.047	34.086
M47409	Hertzog Meat Co. South LLC	Butler	MO	-94.351	38.256
M47409A	Hertzog Premium Beef LLC	Butler	MO	-94.35	38.323
M47412	Blue Tape Foods, LLC	Douglassville	PA	-75.706	40.251
M47417	Timeline Trading	Auburn	WA	-122.226	47.338
M47418	Knights Butchering & Processing, LLC	Keysville	GA	-82.223	33.16
M47420	Western Heritage Meat Company	Sheridan	WY	-106.928	44.8
M47423	FW Logistics- Montezuma Cold Facility	Montezuma	GA	-84.009	32.298
M47424	Hoyo, SBC	Minneapolis	MN	-93.261	44.949
M47426	Hodges	Tulsa	OK	-95.875	36.179
M47428	Tuscany South, LLC	Bartlett	TN	-89.825	35.205
M4743	Nicolosi Foods Inc.	Union City	NJ	-74.037	40.768
M47435	Valeria's Kitchen, LLC	Fitchburg	MA	-71.777	42.567
M47439	Indian Creek Meats	Poplar Bluff	MO	-90.357	36.863
M47441	Kartveli LLC	Monroe Township	NJ	-74.388	40.38
M47442	Julie's Pasture to Plate Meat Market and Processing LLC	Lumberton	MS	-89.35	30.858
M47445	Piedmont BBQ Company LLC	Atlanta	GA	-84.265	33.887
M47452	Glatt Organics LLC	Englewood	NJ	-73.982	40.887
M47462	Colorado Food Enterprises Inc.	Denver	CO	-104.975	39.771
M47465	Imperial Foods	Sacramento	CA	-121.474	38.655
M47472	Pure Pasture Packing, LLC	Sedalia	MO	-93.141	38.688
M47473	Rovagnati North America LLC	Vineland	NJ	-75.068	39.508
M47482	El Rodeo Diced Meats Inc.	Salem	OR	-123.003	44.972
M47483	Renegade Processing, LLC	Becker	MN	-93.866	45.384
M47484	The Durand Smokehouse LLC	Durand	WI	-91.939	44.64
M47486	Ranchers Processing Inc.	Mendota	CA	-120.373	36.758
M47487	Shahnawaz Foods LLC	Middlesex	NJ	-74.487	40.574
M47488	Fallon Livestock Processing, LLC	Fallon	NV	-118.802	39.472
M47491	DC Meat Inc	Duchesne	UT	-110.216	40.172
M47498	Cornhusker Beef Company LLC	Johnson	NE	-96.047	40.441
M474A	Palmyra Bologna Company, Inc.	Lebanon	PA	-76.429	40.341
M4750	Giovanni Veal, Inc.	Woburn	MA	-71.118	42.477
M47502	Patterson's Butcher Shop, LLC	Tompkinsville	KY	-85.754	36.666
M47503	King Street Pizza Company	Elk Grove Village	IL	-87.978	42.031
M47506	Blue Sky RE, LLC	Richland	MS	-90.167	32.277
M47507	ONN Specialties, Inc.	Billerica	MA	-71.275	42.569
M47509	Commissary Azteca	Lodi	CA	-121.272	38.126
M47512	Houston Food Bank	Houston	TX	-95.275	29.781
M47514	Butcher House Meats	Hominy	OK	-96.395	36.465
M47515	Agile Cold ATL NW, LLC	Cartersville	GA	-84.874	34.222
M47516	Winchester Cold Storage	Winchester	VA	-78.152	39.198
M47518	Zimmerman Meats LLC	Summersville	MO	-91.715	37.197
M47519	Carbone's Pizzeria	River Falls	WI	-92.63	44.847
M47523	TPM Foodservice LLC	Solon	OH	-81.467	41.381
M47529	Sustainable Meats LLC	Kuna	ID	-116.249	43.419
M4753	Gene Wenger's Meats & Fine Foods	Elizabethtown	PA	-76.583	40.149
M47531	Wet Noses Natural Dog Treat Co. LLC	Monroe	WA	-122.006	47.866
M47533	Montana Premium Processing Cooperative	Havre	MT	-109.723	48.555
M47534	Agile Cold ATL NE, LLC	Gainesville	GA	-83.753	34.236
M47535	Pinnacle Foods Co.	High Point	NC	-80.033	35.948
M47536	European Food Factory LLC	Livonia	MI	-83.355	42.441
M47540	Premier Freeze Dry	West Haven	UT	-112.026	41.206
M47541	Double L Meat Processing	Jonesville	VA	-83.259	36.698
M47543	Swift Pork Company	Worthington	MN	-95.656	43.559
M47544	Dillsburg Halal Meat, LLC	Dillsburg	PA	-76.987	40.077
M47547	Intermountain Packing, LLC	Idaho Falls	ID	-112.013	43.526
M47551	Tinian Kualidat Meat Processing Center	Tinian	MP	145.628	15.02
M47552	Kitchen Majgek LLC	Lafayette	LA	-92.072	30.231
M47553	Herscher Halal Meat Locker	Herscher	IL	-88.081	41.057
M47555	6 in 1 Meats, LLC	New Salem	ND	-101.406	46.839
M47558	Allen Brothers	Opa-Locka	FL	-80.291	25.906
M47560	John Soules Foods, Inc.	Valley	AL	-85.177	32.781
M47561	Fresh Ideas Co., Inc.	Charlestown	MA	-71.074	42.378
M47564	Bruders Abbatoir, LLC	Brooten	MN	-95.046	45.587
M47565	Lineage Logistics, LLC	Joliet	IL	-88.026	41.506
M47567	Bear Mountain Beef Inc.	Hawk Springs	WY	-104.284	41.737
M47576	The Butcher Barn	Dyersburg	TN	-89.339	36.013
M47578	Anderson Meats and Processing Inc.	Hartsville	TN	-86.153	36.408
M47579	Tyson Foods Inc.	Humboldt	TN	-88.926	35.851
M47580	Farm Creek Meats, LLC	Duchesne	UT	-110.394	40.191
M47581	Foodland Super Market, Limited	Waipahu	HI	-158.024	21.376
M47585	A Cut Above Processing and Meat Market, LLC	Perkinston	MS	-89.434	30.604
M47586	Fimus Limited	Luray	VA	-78.452	38.666
M47592	North Bay Butchers, LLC	Petaluma	CA	-122.576	38.279
M47592A	North Bay Butchers, LLC	Marshall	CA	-122.825	38.15
M47596	Food Fusion NJ LLC	Bridgeton	NJ	-75.221	39.424
M47597	Royalty Meats & Poultry, LLC	Rockaway	NJ	-74.518	40.895
M47599	Niagara Food Specialties USA, Inc.	Lyndonville	NY	-78.465	43.346
M4760	Salt & Strings Butchery	Louisville	IL	-88.503	38.773
M47600	Arizona Beef LLC	Tucson	AZ	-110.957	32.179
M47604	QBANS, CORP	Naranja	FL	-80.411	25.518
M47612	Premium California Foods	Winton	CA	-120.615	37.373
M47615	S Ranch Meats, LLC	Hardin	MT	-107.592	45.735
M47615A	S Ranch Meats LLC	Hardin	MT	-107.624	45.731
M47617	DUTCH MILL CATERING T/A TORN APRON FOODS	Brentwood	MD	-76.953	38.943
M47618	Second Harvest Heartland	Brooklyn Park	MN	-93.383	45.084
M47620	Venice Bakery	Hamden	CT	-72.925	41.36
M47624	Daniels Gourmet Meats	Bozeman	MT	-111.042	45.7
M47630	Locust Hill Specialty Foods, LLC	Brookfield	OH	-80.571	41.227
M47631	Adam's Sausage Factory	Rancho Cordova	CA	-121.258	38.609
M47633	Prairie Smokehouse Partners	Springfield	IL	-89.584	39.837
M47637	BSA Seafood, LLC	Grasonville	MD	-76.2	38.96
M47638B	The Salumeria LLC	Austin	TX	-98.008	30.236
M47639	Restaurant Consulting Group LLC	Mission	TX	-98.326	26.229
M47641	Concession Service Systems, Inc.	Miami	FL	-80.346	25.768
M47644	HLC Custom Processing LLC	Andrews	TX	-102.575	32.32
M47645	Barakat Slaughter House, LLC	Drummonds	TN	-89.897	35.505
M47648	Cowboy Meat Company	Forsyth	MT	-106.675	46.265
M47655	Waldo Pizza Waldo, LLC	Kansas City	MO	-94.594	38.993
M47656	Prime Country Meats	Horatio	AR	-94.312	33.935
M47662	JA Angus Processing LLC	Bristol	FL	-84.969	30.412
M47665	Booth Creek Wagyu	Riley	KS	-96.831	39.296
M47667	Fayman & Sorbello Food Group LLC	Madill	OK	-96.762	34.09
M47674	Producers Partnership	Livingston	MT	-110.334	45.701
M47678	Lorenz and Hammond, LLC dba Oxbow Meats	Lawrenceburg	KY	-84.872	37.966
M47681	Gap View Homestead, LLC	Kinzers	PA	-76.018	39.975
M47682	Firehouse Jams, LLC	Erwinna	PA	-75.072	40.499
M47683	Presto Foods Corp.	Doral	FL	-80.351	25.791
M47685	Bonfire Burritos LLC	Golden	CO	-105.178	39.724
M47688	Squire's Cafe, Inc	Baltimore	MD	-76.529	39.272
M47691	Skinny Crust LLC	East Dundee	IL	-88.242	42.113
M47693	Hugo Trading, Inc.	Gardena	CA	-118.303	33.912
M47694	Noujaim's Food, LLC	Winsted	CT	-73.072	41.921
M47696	Buckaroo Meat Company	Camden	TN	-88.177	36.044
M47697	Pure Cut Poultry	Hardeeville	SC	-81.079	32.297
M47699	US Foods, Inc	Loveland	CO	-104.995	40.453
M47708	Yankee Trader Seafood, Ltd., DBA Emma-Leigh & Co.	Hingham	MA	-70.92	42.163
M47709	Greeley Smokehaus & Meats	Braham	MN	-93.066	45.74
M4771	B & M Philly Steaks, Inc.	Harleysville	PA	-75.405	40.275
M47710	Black River Meats	Withee	WI	-90.638	45.064
M47711	The Butcher Shop at Hyde Farms, LLC	Greenback	TN	-84.181	35.624
M47712	Bob's Jerky For A Cause	Manchester	CT	-72.507	41.79
M47715	Palmetto Fresh Meats	Aynor	SC	-79.208	33.988
M47716	Tennessee Grass Fed LLC	Clarksville	TN	-87.146	36.457
M47720	Pitcock Meat Processing Inc.	Pope	MS	-89.827	34.199
M47722	Thege's Wild West Bar-B-Que, LLC	Columbus	NE	-97.341	41.51
M47733	Alanis Food LLC	Houston	TX	-95.494	29.984
M47734	Compass Group USA, Inc. DBA MG Foods	Lenexa	KS	-94.764	38.952
M47735	Burnett Meats	Melber	KY	-88.776	36.932
M47739	Jackson Manufacturing LLC dba Bear State Kitchen	El Segundo	CA	-118.405	33.918
M47742	Local Cuts Meat Company	Zephyr	TX	-98.798	31.685
M47746	Josefa LLC	Elizabeth	NJ	-74.213	40.645
M47747	Canaan Mountain Meats LLC	Colorado City	AZ	-112.991	36.995
M47749	Tucson Tamale Wholesale Company LLC	Tucson	AZ	-110.97	32.2
M47750	Marceh Banjul U.S.A.	Lithonia	GA	-84.076	33.774
M47751	David R. Kanagy	Rebersburg	PA	-77.397	40.951
M47760	Rome Sausage	Golden	CO	-105.178	39.724
M47762	Fayman & Sorbello Food Group LLC	Madill	OK	-96.762	34.09
M47764	Pasta Acquisition LLC	Saint Louis	MO	-90.222	38.593
M47775	Falls Meat Service Inc.	Pigeon Falls	WI	-91.21	44.426
M47776	True World Foods Los Angeles LLC	Vernon	CA	-118.238	34.006
M47784	Old North State Artisans, LLC.	Asheville	NC	-82.548	35.602
M47785	Babynov USA, LLC	Red Boiling Springs	TN	-85.865	36.529
M47789	Stone Gardens Farm	Shelton	CT	-73.155	41.317
M47791	D&D Meats Inc.	Celina	TN	-85.486	36.531
M47793	Wycliff Douglas Provisions	Mesquite	TX	-96.672	32.789
M47797	Outback Premium Meats LLC	Forreston	IL	-89.578	42.126
M47798	Best Deal Brokerage LLC	Vernon	CA	-118.183	34.0
M4780	Premio Foods Inc.	Hawthorne	NJ	-74.154	40.96
M47804	Troudt Meats, LLC	Otis	CO	-103.067	40.266
M47805	New Hira Farm LLC	Tomball	TX	-95.73	30.04
M47807	Upside Foods, Inc.	Emeryville	CA	-122.294	37.843
M47808	Evermade Foods LLC	Warrenton	VA	-77.679	38.75
M47814	Amana Farms Beef	Homestead	IA	-91.872	41.763
M47815	South Canadian Meats LLC	Thomas	OK	-98.721	35.74
M47818	Short Creek Meats, LLC	Kennebunk	ME	-70.559	43.405
M4782	Jimmy E, Inc.	Brooklyn	NY	-74.022	40.647
M47822	Utz Quality Foods, LLC.	Kings Mountain	NC	-81.34	35.219
M47825	Mesa Foods	Rancho Cucamonga	CA	-117.55	34.105
M47826	J-H Cattle Co. & Meat Store	Joplin	MO	-94.498	37.092
M47827	Salt + Smoke	Maryland Heights	MO	-90.434	38.708
M47833	E & T Porky Bites	Sylvester	GA	-83.846	31.531
M47835	Service Meat Distributors, LLC	Stone Mountain	GA	-84.183	33.828
M47836	Vertical Cold Storage, LLC	Bolingbrook	IL	-88.129	41.663
M47839	Catalyst Foods	Sumner	WA	-122.222	47.203
M47843	Diamond State Meats, LLC	Rehoboth Beach	DE	-75.099	38.711
M47844	Obalende Foods, LLC	Redlands	CA	-117.218	34.061
M47847	Taiba LLC	Conyers	GA	-84.062	33.692
M47848	Wilson's Meats, LLC.	Traverse City	MI	-85.583	44.733
M47852	Farmstead Butcher Block LLC	Central City	KY	-87.107	37.244
M47854	Indiana Meat and Poultry Processors Inc	LaGrange	IN	-85.535	41.655
M47856	Ludington Meat Company	Ludington	MI	-86.375	43.955
M4786	U. S. Beef Inc.	Beltsville	MD	-76.913	39.028
M47861	Vermont's Farmhouse Jerky Co.	Essex Junction	VT	-73.067	44.51
M47864	Salumi Chicago, Inc	Chicago	IL	-87.69	41.808
M47865	Ayam Yook LLC	Moonachie	NJ	-74.07	40.838
M47867	Divine Meats, Inc.	Ferris	TX	-96.648	32.584
M47868	Houston Sausage Inc.	Houston	TX	-95.58	29.705
M47870	Try Our, Inc.	Parma	OH	-81.694	41.417
M47874	PF Meats Company, Inc.	Anderson	SC	-82.686	34.602
M47877	Modern Heritage Wholesome Foods, LLC	Ocala	FL	-82.109	29.251
M47878	La Regina Atlantica LLC	Alma	GA	-82.51	31.547
M47879	Looped Square Meat Company	Beggs	OK	-96.015	35.81
M4788	Rock Run Butchering Company, LLC	Newville	PA	-77.417	40.24
M47880	Highland Farm Fresh LLC	Grantsville	MD	-79.128	39.719
M47882	Circle M Meats	Monett	MO	-93.909	36.928
M47884	Giordano's	Chicago	IL	-87.626	41.896
M47886	Blair Meat Market LLC	Blair	WI	-91.239	44.291
M47889	The Real Good Foods Company, LLC	Bolingbrook	IL	-88.091	41.67
M47893	Alex Meats, Inc.	Chicago	IL	-87.625	41.772
M47896	JT2 Burger, LLC	Tyler	TX	-95.275	32.351
M47898	Windy N Ranch, LLC	Ellensburg	WA	-120.646	47.067
M47904	Snacks Creations LLC	El Paso	TX	-106.32	31.747
M47905	JBS Prepared Foods	Columbia	MO	-92.276	39.003
M47906	Bluebird Locker Inc	Delmont	SD	-98.164	43.268
M47910	Meat King, Inc.	Brooklyn	NY	-74.005	40.685
M47912	Burly Brothers Country Butchery	Attica	NY	-78.207	42.861
M47915	BMB Ventures	White Sulphur Springs	MT	-110.91	46.542
M47916	Lighthouse Custom Meats LLC	Bloomfield	IN	-87.01	39.031
M47918	Hanzlian's Sausage & Deli	Cheektowaga	NY	-78.796	42.919
M47921	Wright's Meat Processing INC.	Summerville	GA	-85.212	34.53
M47927	Spray-Tek LLC	Beloit	WI	-88.968	42.511
M47928	Midwest Meat Company	Minden	NE	-98.933	40.503
M4793	Port Oram Foods Inc.	Wharton	NJ	-74.584	40.898
M47930	Kountry's Pork Skins, LLC	Tar Heel	NC	-78.795	34.731
M47934	Georgia Meat Distributor Inc.	Dalton	GA	-84.967	34.764
M47936	Easton Meat Services, Inc.	Easton	PA	-75.211	40.673
M47937	US Meat Processing, LLC	Astoria	NY	-73.901	40.777
M47939	NY Delicacy Inc.	Fresh Meadows	NY	-73.788	40.727
M47945	Puro Alentejano Iberian Hog Corp	Salem	NJ	-75.405	39.538
M47954	Arlington Valley Farms	Hudson	OH	-81.449	41.209
M47956	Volo Packing & Market	Volo	IL	-88.161	42.325
M47957	Jim's Spaghetti Sauce, LLC	Nashville	TN	-86.766	36.145
M47959	Viet Huong LLC	Garland	TX	-96.699	32.915
M47961	3333 Foods	Roseville	IL	-90.748	40.664
M47963	The Butcher Shop, Inc.	Oakes	ND	-98.097	46.134
M47966	5L Baking Company LLC	Navasota	TX	-96.053	30.404
M47967	Fratelli Beretta USA, INC.	Mount Olive	NJ	-74.729	40.907
M47969A	Rocky Mountain Meats LLC	Cortez	CO	-108.611	37.32
M47970	I’O Processing, Inc.	Kailua – Kona	HI	-155.978	19.732
M47971	Ajinomoto Foods North America	Joplin	MO	-94.396	37.056
M47972	Lou Malnati's Priority Pizza, LLC	Buffalo Grove	IL	-87.939	42.172
M47973	Coon Creek Packing LLC	Caro	MI	-83.374	43.478
M47974	Crystal Freeze Dry	Panora	IA	-94.362	41.687
M47975	Ascent Foods, LLC	Laredo	TX	-99.511	27.552
M47977	TN Premium Beef/Mason Processing	Covington	TN	-89.697	35.569
M47988	The Meat Pointe LLC	Garfield	NJ	-74.11	40.875
M4799	Mastroianni Food Distributor	Amsterdam	NY	-74.173	42.931
M47990	Patagonia Flavors	Miami	FL	-80.241	25.796
M47991	Compass Group USA	Oak Creek	WI	-87.919	42.857
M47993	Mason Hills LLC	Grand Bay	AL	-88.318	30.451
M47994	Saporicalabresi	Salem	NJ	-75.379	39.598
M47996	Making Ends	Brooklyn	NY	-74.007	40.656
M4800	Eddy Packing Co., Inc.	Yoakum	TX	-97.141	29.312
M48066	Route 66 Meat Processing	Sayre	OK	-99.647	35.252
M48082	California Farms Meat Company Inc.	Vernon	CA	-118.205	34.003
M48083	Sonoma County Meat Co.	Santa Rosa	CA	-122.72	38.432
M48087	Marin Sun Farms, Inc.	Petaluma	CA	-122.647	38.251
M48088	Reams Family Foods, Inc.	Hudson	WI	-92.743	44.964
M48089	Bright People Foods, Inc.	Woodland	CA	-121.743	38.679
M48094	Protein Provisioners, LLC	Arden Hills	MN	-93.15	45.056
M48095	Walke Brothers Meat Processing	Claremore	OK	-95.654	36.265
M48097	Yosemite Valley Beef Distributors	Los Angeles	CA	-118.215	34.016
M48098	Mistica Foods	Addison	IL	-87.991	41.916
M48098E	Mistica Foods LLC	Franklin Park	IL	-87.91	41.944
M48098M	Mistica Foods LLC	Addison	IL	-88.034	41.918
M48098N	Mistica Foods LLC	Franklin Park	IL	-87.901	41.942
M48104	East Mountain Dumplings, Inc.	San Diego	CA	-117.139	32.894
M48108	People's Meats LLC	Stevens Point	WI	-89.445	44.515
M48109	Star Natural Meats LLC	Astoria	NY	-73.903	40.771
M48110	Ruth Premium Meat, LLC	Queen City	MO	-92.561	40.41
M48111	Weaver Meat Processing LLC	Hartselle	AL	-86.997	34.37
M48114	Vesar Foods LLC	Brookshire	TX	-95.945	29.781
M48119	Custom Craft Poultry	Batesville	AR	-91.622	35.791
M48120	AdvancePierre Foods, Inc	Caseyville	IL	-90.056	38.61
M48121	Haines Farming and Meat Processing	Gibbon Glade	PA	-79.637	39.73
M48130	GFP Processors, LLC	Ingram	TX	-99.238	30.076
M48132A	Goodwell Foods, LLC	Pittsfield	NH	-71.33	43.305
M48136	Wei-Chaun U.S.A. Inc	Murfreesboro	TN	-86.399	35.835
M48141	Halperns' Steak and Seafood Company, LLC	Grand Prairie	TX	-97.043	32.787
M48146	Noxubee County Producers Inc	Macon	MS	-88.55	33.09
M48147	Simmons Farm Raised Catfish, Inc	Yazoo City	MS	-90.521	32.92
M48150	Lakes Farm Raised Catfish Inc	Dundee	MS	-90.437	34.559
M48153	Fish Processors	Hagerman	ID	-114.889	42.779
M48154	Mezban Foods	Dallas	TX	-96.894	32.818
M48156	Baily Meat LLC	Las Vegas	NV	-115.198	36.079
M48157	Del Barrio Foods, LLC.	Lockport	IL	-87.993	41.579
M48158	Northwest Meat Company	Chicago	IL	-87.665	41.888
M48159	Regional Food Bank of Oklahoma	Oklahoma City	OK	-97.615	35.431
M48161	Eggert Slaughtering, Inc.	Deer Park	WI	-92.278	45.165
M48165	Stokes Fish Company	Leesburg	FL	-81.917	28.819
M48174	Chicago Seafood & Restaurant Supply Inc.	Chicago	IL	-87.735	41.816
M48176	Tampa Bay Fisheries, Inc.	Dover	FL	-82.237	27.992
M48181	Ashton Farms Custom Meats	Fillmore	UT	-112.278	39.001
M48183	IPMF, LLC., dba Naturpak	Janesville	WI	-88.955	42.674
M48184	Hawaii Island Meat Cooperative	Kealakekua	HI	-155.924	19.51
M48189	Shaw's Soutthern Belle frozen Foods, Inc	Jacksonville	FL	-81.639	30.385
M48195	Farmer's Pride	Bowdon	GA	-85.33	33.622
M48196	Anna's Kitchen, Inc.	Woburn	MA	-71.146	42.514
M48198	D & D Fish & Caviar Co	Eva	TN	-87.993	36.112
M482	St. Croix Abattoir	Kingshill	VI	-64.808	17.718
M4820	Claro's Italian Markets, Inc.	San Gabriel	CA	-118.086	34.081
M48200	Stoltzfus Kitchen	Chuckey	TN	-82.65	36.183
M48201	Wang Cai Enterprise, Inc.	Sunnyside	NY	-73.926	40.742
M48204	Kingsland Food Processing Corp.	Maspeth	NY	-73.92	40.72
M48205	ColdPoint Logistics Warehouse, LLC	Edgerton	KS	-94.949	38.799
M48209	Wholesum Foods, LLC	South El Monte	CA	-118.035	34.048
M48210	Kentucky Meat Smith LLC	Science Hill	KY	-84.634	37.193
M48213	Junior's Smokehouse Processing Plant	El Campo	TX	-96.251	29.196
M48219	Panola County Processing LLC	Carthage	TX	-94.269	32.104
M48223	Tamales Los Mayas LLC	Hayward	CA	-122.119	37.647
M48225	Afia Foods	Taylor	TX	-97.481	30.571
M48226	Sky Halal Meats	New Haven	MO	-91.368	38.546
M48227	Artisan Chef Manufacturing Company DBA: Tuscan Market	Lawrence	MA	-71.171	42.7
M48230	Panna Manufacturing LLC	Miami	FL	-80.197	25.944
M48232	Schweid and Sons	College Park	GA	-84.529	33.607
M48233	Flying Food Group LLC	Vernon	CA	-118.209	34.009
M48234	Off The Dock Seafood, LLC	Memphis	TN	-89.946	35.042
M48235	Crescent Specialty Foods, LLC	Farmingdale	NY	-73.413	40.754
M48238	AC's Yummy Jerky LLC	Statesville	NC	-80.944	35.804
M48241	Get Seafood, Inc.	Winter Haven	FL	-81.741	27.969
M48249	Country Butcher	West Linda	CA	-121.58	39.123
M48255	WURST MACHERS LLC	MORRIS	MN	-95.893	45.5
M48257	Journeyman Meat Company	Cloverdale	CA	-123.004	38.787
M48258	F&S Produce West LLC dba F&S Fresh Foods	Riverside	CA	-117.301	33.932
M4826	New Temple Meat Co.	City of Industry	CA	-117.979	34.042
M48260	Legacy Custom Meat Processing	La Grange	TX	-96.797	29.9
M48262	King's Fish Market, Inc.	Jonesville	LA	-91.805	31.652
M48267	BUSTER RINDS LLC	Jackson	MS	-90.18	32.291
M4827	La Espanola Meat, Inc.	Harbor City	CA	-118.291	33.797
M48270	Patriot Meat Processing	Ona	WV	-82.174	38.447
M48272	Inland Seafood-Birmingham D.B.A. American Butcher Company	Birmingham	AL	-86.904	33.507
M48277	WJ Wainright and Son, Inc	Nahunta	GA	-81.994	31.097
M4828	A.I. Foods Corporation	Los Angeles	CA	-118.197	34.064
M48281	White Lake Foods, LLC	Ferndale	NY	-74.741	41.753
M48282	M & R Fish	Abbeville	AL	-85.107	31.648
M48285	A Butchery Shoppe	Spring Valley	WI	-92.238	44.843
M48286	Yassine Halal Food Corp	Astoria	NY	-73.935	40.759
M48287	Quality Custom Meats, LLC	Howard	SD	-97.52	44.008
M48291	Food Processing and Innovation Center (FPIC)	Okemos	MI	-84.455	42.679
M48297	Dave's Supermarket	Fairbury	IL	-88.514	40.746
M48298	A Farm Inc.	South El Monte	CA	-118.039	34.047
M4831	C&H Meat Co.	Vernon	CA	-118.214	34.009
M48311	Gagliano Sausage CO	Pueblo	CO	-104.613	38.244
M48314	Midwest Kitchens, LLC	Erie	PA	-80.08	42.141
M48315	Safety Fresh Foods LLC	Plymouth	WI	-87.973	43.739
M48317	Bednar Meats Inc. (DBA-Custom Foods)	Chicago	IL	-87.651	41.812
M4838	The Butcher Block Meats	San Diego	CA	-117.137	32.696
M4846	Heatherfield Foods LLC	Moreno Valley	CA	-117.287	33.924
M48465	Meat Science and Animal Biologics Discovery	Madison	WI	-89.419	43.076
M48469	Tri-State Fish	South Pittsburg	TN	-85.748	35.063
M4847	Win Fat Food LLC	Monterey Park	CA	-118.151	34.053
M48473	Fitza Pizza	Rockford	IL	-89.057	42.252
M48476	Saigon Kitchen LLC	Norcross	GA	-84.192	33.919
M4852	Deseret Farms, LLC	Spanish Fork	UT	-111.651	40.125
M4860	Stafford  Meat Company, Inc.	Rio LInda	CA	-121.43	38.698
M48643	El Puerquito De Oro ll, Inc	Garfield	NJ	-74.111	40.885
M4871	Golden Eagle Services	South Gate	CA	-118.224	33.962
M4872	Modern Meat, Inc	San Bernardino	CA	-117.256	34.136
M4873	Commercial Meat Company, Inc.	Pico Rivera	CA	-118.114	33.975
M4876	Luck Nabeshima	Montebello	CA	-118.118	34.009
M4891	Colorado Premium Foods	Greeley	CO	-104.681	40.405
M4893	Four Star Meat Co	Long Beach	CA	-118.167	33.88
M4894	Apple Valley Farms Inc.	Fresno	CA	-119.789	36.759
M4907	Hearthside Food Solutions LLC d/b/a Maker's Pride	Salt Lake City	UT	-112.03	40.779
M4911	Al's Wholesale Meats, Inc.	Montebello	CA	-118.122	34.001
M4912	H. F. Meats, Inc.	La Crescenta	CA	-118.241	34.224
M4914	In-N-Out Burger	Chino	CA	-117.644	33.966
M4914D	In-N-Out Burgers	Lancaster	TX	-96.812	32.64
M4914L	In-N-Out Burgers	Lathrop	CA	-121.297	37.802
M4928	Islamic Meat & Poultry Co.	Stockton	CA	-121.275	37.941
M4933	American Outdoor Products, Inc	Boulder	CO	-105.206	40.07
M4934	T & J Sausage Kitchen	Anaheim	CA	-117.871	33.856
M4940	Meat Production Inc.	Kalispell	MT	-114.307	48.172
M4943	Sweety Novelty, Inc.	Torrance	CA	-118.299	33.856
M4968A	Great Western Meats	Las Vegas	NV	-115.094	36.237
M4969	JJ Meats Company	Madera	CA	-120.084	36.83
M4972	R&R Quality Meat Inc.	Anderson	CA	-122.361	40.492
M4976	RMFF Holdco LLC	Englewood	CO	-105.009	39.665
M4985	Modesto Food Distributors, Inc.	Hayward	CA	-122.05	37.616
M4989	K&M Meat Packing Co., Inc.	Vernon	CA	-118.229	34.013
M4993	Whiskey Hill Smokehouse LLC	Hubbard	OR	-122.806	45.181
M4D	Campbell Soup Supply Company	Napoleon	OH	-84.121	41.386
M4K	Campbell Soup Supply Company L.L.C.	Paris	TX	-95.562	33.685
M4L	Conagra Brands (ConAgra Foods Packaged Foods, LLC)	Fayetteville	AR	-94.178	36.05
M4P	Campbell Soup Company	Camden	NJ	-75.108	39.941
M4R	Campbell Soup Company	Maxton	NC	-79.325	34.774
M5	Zwanenberg Food Group (USA), Inc.	Cincinnati	OH	-84.623	39.136
M500	Land O' Frost	Lansing	IL	-87.545	41.589
M500A	Land O'Frost, Inc	Searcy	AR	-91.728	35.239
M500K	Land O'Frost, Inc.	Madisonville	KY	-87.551	37.356
M500R	Land O' Frost	Munster	IN	-87.513	41.529
M5057	The Alpine Wurst & Meat House	Honesdale	PA	-75.218	41.551
M5067	Kingsland Meat Distributors Inc.	Woodland Park	NJ	-74.193	40.906
M5070	Quality Food Company	West Warwick	RI	-71.507	41.67
M5072	Amazon Foods, Inc.	Chicopee	MA	-72.61	42.144
M5073	Cesina Sausage Co.	Aliquippa	PA	-80.261	40.614
M50775	Fleish Yavesh, Inc.	Hewlett	NY	-73.688	40.649
M50783	Slasham Valley Farms LLC	Ashville	AL	-86.157	33.862
M50789	Monogram Gourmet	Medford	MA	-71.081	42.414
M50790	Southern Cuts Processing, LLC	Pitts	GA	-83.579	31.955
M50792	Cali Dumpling	South El Monte	CA	-118.057	34.047
M50798	Sullivan Meat Locker	Sullivan	MO	-91.131	38.237
M50800	Rowena Packing LLC	Rowena	TX	-100.033	31.661
M50801	Roma Grocery Co.	Saint Louis	MO	-90.202	38.635
M50802	Classic Farms LLC	Fort Jones	CA	-122.907	41.606
M50804	Koehler's Meat and Sausage Company	Gillette	WY	-105.484	44.248
M50806	Fanny Food Peruvian Corp.	Hialeah	FL	-80.332	25.896
M50808	Molinas Provision	Everett	MA	-71.051	42.393
M50809	Kroger Mountain View Foods	Denver	CO	-104.872	39.794
M50810	Alki Bakery Inc.	Kent	WA	-122.223	47.431
M5097	Bayside Foods, Inc.	PROVIDENCE	RI	-71.42	41.844
M509K	Smithfield Packaged Meats Corp.	Kansas City	MO	-94.598	38.877
M509L	Smithfield Packaged Meats Corp.	Lincoln	NE	-96.717	40.812
M5101	Master Purveyors, Inc.	Bronx	NY	-73.872	40.807
M5107	Chef's Choice Cash & Carry Food Distribution Inc	Brooklyn	NY	-73.93	40.647
M511	Cargill Meat Solutions	Timberville	VA	-78.783	38.635
M51173	Urth Hawthorne Commissary, LLC	Hawthorne	CA	-118.364	33.897
M51174	Synergy Flavors Innova LLC	Chicago	IL	-87.662	41.827
M51174A	Synergy Flavors lnnova, LLC	Chicago	IL	-87.652	41.815
M51182	Symrise Inc.	Elyria	OH	-82.128	41.406
M51184	Bauman's Butcher Block	Ottawa	KS	-95.294	38.522
M51192	Table 87 Frozen, LLC	Brooklyn	NY	-74.013	40.654
M51195	Zetlian Bakery, Inc	Sun Valley	CA	-118.37	34.202
M51200	Blossom Foods, LLC	Oakland	CA	-122.288	37.82
M51204	New York Beef Company, LLC	Poughkeepsie	NY	-73.802	41.653
M51205	BrucePac	Durant	OK	-96.349	33.997
M51207	Daily's Premium Meats, LLC	St. Joseph	MO	-94.873	39.718
M51208	Swan Market	Rochester	NY	-77.567	43.166
M51210	Alabama Catfish LLC	Uniontown	AL	-87.504	32.45
M51212	Dongsuh Inc.	Maywood	CA	-118.192	33.995
M51216	Prime Line Inc	Scooba	MS	-88.369	32.906
M51217	Haring Catfish	Wisner	LA	-91.679	31.969
M51218	OSI Industries, LLC	Riverside	CA	-117.315	34.002
M5122	Weichsel Beef	Brooklyn	NY	-74.011	40.679
M51223	Lake City Fish Market	Grand Rivers	KY	-88.241	37.028
M51226	Renderology, LLC	Camp Verde	AZ	-111.858	34.567
M51226A	Renderology LLC	Camp Verde	AZ	-111.838	34.546
M51232	DC'S Fish Market	Guild	TN	-85.535	35.033
M51233	Davis Fish Market	Hornbeak	TN	-89.354	36.379
M51234	Santora Foods LLC	Depew	NY	-78.727	42.91
M51237	OSI Industries, LLC	Chicago	IL	-87.665	41.817
M51240	Richelieu Foods Inc	Wheeling	IL	-87.92	42.111
M51243	Shaw Bakers, LLC	South San Francisco	CA	-122.407	37.639
M51243A	Shaw Bakers LLC	San Leandro	CA	-122.171	37.694
M51244	Circle S Groom Sausage LLC	Groom	TX	-101.108	35.201
M51245	Evangel International Foods	Pasadena	TX	-95.206	29.672
M51248	MG Foods	Longview	TX	-94.712	32.491
M51249	McElwee Butchering, LLC	Newville	PA	-77.406	40.134
M51250	Najaf Halal Meat Co.	Friendsville	PA	-76.005	41.908
M51252	La Belle Farm, Inc.	Scott Township	PA	-75.588	41.574
M51253	Total Packaging	Owensboro	KY	-87.121	37.724
M51255	Natural State Processing	Clinton	AR	-92.458	35.568
M51256	LaGustosa Food Products & Imports Co., Inc.	Franklin Square	NY	-73.683	40.697
M51257	MRK Foods, Inc.	Roscoe	IL	-89.011	42.398
M51261	Mercado Meat Distribution	Willows	CA	-122.194	39.526
M51263	Stamford Smokehouse LLC	Stamford	NY	-74.617	42.408
M51269	Golden Gourmet, LLC	Americus	GA	-84.206	32.114
M51270	Bellville Meat Market Processing	Bellville	TX	-96.253	29.947
M51278	Sea Watch International, Ltd	Easton	MD	-76.069	38.796
M51279	Encore Seafoods, Inc.	Sparks	NV	-119.748	39.532
M51280	Jones Fish House Inc.	Canal Point	FL	-80.636	26.856
M51282	Foods On The Fly LLC	San Diego	CA	-117.17	32.886
M51283	Dean & Peeler Meatworks	Poth	TX	-98.092	29.078
M51290	Bahar, LLC	Clifton	NJ	-74.138	40.877
M51291	Prime Foods, LLC	Boonville	IN	-87.307	38.046
M51295	SK Food Group	Tolleson	AZ	-112.222	33.442
M51300	Phillips Meats LLC	Zanesville	OH	-82.051	39.932
M51302	Belmont Meats, LLC	Paradise	PA	-76.112	39.991
M51303	USA Beef Packing, LLC	Roswell	NM	-104.425	33.364
M51304	Bordelon's Fish Market LLC	Mansura	LA	-92.05	31.063
M51305	Channel Fish Processing Co., Inc.	Braintree	MA	-70.976	42.19
M51306	Powell Meat Company LLC	Clinton	MO	-93.775	38.386
M51308	Miniat Foods LLC	Carrollton	GA	-85.097	33.611
M51310	Fresh Food TOGO Inc.	Cincinnati	OH	-84.454	39.225
M51315	Clean Eatz Kitchen	Wilmington	NC	-77.84	34.262
M51315A	CE Kitchen LLC	Wilmington	NC	-77.933	34.183
M51315B	Clean Eatz Kitchen	Salt Lake City	UT	-112.024	40.731
M51315C	Clean Eatz Kitchen	Maryland Heights	MO	-90.469	38.751
M51316	Out Of The Shell	South El Monte	CA	-118.057	34.047
M51317	Oasis Seafood, Inc.	North Las Vegas	NV	-115.133	36.209
M51320A	Vida Meat Company	Las Vegas	NV	-115.145	36.179
M51322	World Food P&D, Inc.	Commerce	CA	-118.135	34.004
M51323	BRC Eatery	Miami	FL	-80.395	25.647
M51326	Savignano Foods Corp.	Orange	NJ	-74.24	40.773
M51327	B&A Gourmet Foods LLC	Hialeah	FL	-80.359	25.915
M51333	Bell Flavors & Fragrances	Northbrook	IL	-87.859	42.144
M51337	Carniceria Camacho	Tucson	AZ	-110.969	32.172
M51337A	Carniceria Camacho	Tucson	AZ	-110.968	32.172
M51340	Eagle Grove Cooperative	Eagle Grove	IA	-93.912	42.59
M51341	Zuppardi's Frozen Foods	West Haven	CT	-72.945	41.274
M51344	Sky Chefs, LLC	Sacramento	CA	-121.596	38.688
M51346	Jubilee Hilltop Ranch	Osterburg	PA	-78.559	40.163
M51347A	Sea Farms, Inc.	Hayes	VA	-76.42	37.28
M51349	Total Packaging LLC	Owensboro	KY	-87.092	37.768
M51351	Underground Slaughter LLC	Walling	TN	-85.606	35.856
M51353	Leo's Gluten Free, LLC	Franklin Park	IL	-87.879	41.941
M51354	Select Cut Meat Processing	Chicago	IL	-87.638	41.857
M5137A	Nardone Brothers Baking Company, LLC	Hanover Township	PA	-75.923	41.207
M5138	Reliable Wholesale Meats	Brooklyn	NY	-74.011	40.679
M5141	King Solomon Foods inc.	Brooklyn	NY	-74.022	40.647
M5142	Washington Avenue Poultry	Brooklyn	NY	-74.006	40.685
M5151	Best Provisions	Newark	NJ	-74.196	40.724
M5152	DeSola Provisions Corp.	Bronx	NY	-73.872	40.807
M51548	Meat Cooler, Inc.	Saltsburg	PA	-79.346	40.574
M5155	Sahlen Packing Company, Inc.	Buffalo	NY	-78.842	42.884
M51553	North American Caviar Inc	Paris	TN	-88.25	36.364
M51554	Compass Group USA, Inc.	Melbourne	FL	-80.666	28.095
M51556	Smithfield Distribution, LLC	Tar Heel	NC	-78.808	34.749
M51557	Ralph's Packing Company	Perkins	OK	-97.04	35.978
M5155A	Sahlen Packing Co., Inc.	Buffalo	NY	-78.842	42.883
M51563	Patriot Jerky, LLC	Conover	NC	-81.22	35.705
M51565	Eldridge Tamales, LLC	Augusta	AR	-91.363	35.077
M51566	Silver Horn Jerky	Pensacola	FL	-87.262	30.424
M51567	Sunny Dell Specialty LLC	Oxford	PA	-75.975	39.786
M5161	Fuji Foods, Inc.	Browns Summitt	NC	-79.728	36.173
M5161A	Fuji Foods, Inc	Browns Summit	NC	-79.73	36.175
M5197	David Mosner, Inc.	Bronx	NY	-73.872	40.807
M5200	Prime Food Distributor, Inc.	Port Washington	NY	-73.664	40.814
M5210	Liberty Bell Steak Co	Philadelphia	PA	-75.102	39.994
M5221	Home Food Services of PA, Inc.	Bristol	PA	-74.841	40.108
M5221A	Home Food Services of PA, Inc., DBA Agostino Foods	Fallsington	PA	-74.815	40.19
M5223A	Manchester Packing Co., Inc.	Hartford	CT	-72.658	41.748
M525	Rudolph Foods Company Inc.	Beaumont	CA	-116.998	33.927
M526	Robert M. Kerr Food and Agricultural Products Center	Stillwater	OK	-97.072	36.125
M5268	Cola Foods, LLC	Cranston	RI	-71.457	41.787
M5274	L.B. ORIENTAL FOOD PRODUCT CO., INC.	PAWTUCKET	RI	-71.363	41.883
M5275	Lupo's Quality Deli	Endicott	NY	-76.077	42.095
M5281A	PRG Packing Corp.	Madison	FL	-83.411	30.454
M5292	G & L Meat Company, Inc.	North Syracuse	NY	-76.128	43.124
M5294	Green Tree Foodservice	Passaic	NJ	-74.129	40.866
M5297	Big Dog Meats LLC	West Haven	CT	-72.992	41.265
M5300	Rhode Island Beef & Veal, Inc.	Johnston	RI	-71.483	41.843
M5307	Cook's Wholesale Foods Inc.	Old Forge	PA	-75.727	41.376
M5307A	Cooks Wholesale Foods, Inc.	Berwick	PA	-76.238	41.061
M5307B	Cooks Wholesale Foods, Inc.	Swoyersville	PA	-75.868	41.307
M532	Swift Beef Company	Omaha	NE	-95.945	41.213
M5333	Zweigle's Inc.	Rochester	NY	-77.626	43.164
M5335	Mrs. Budd's Kitchen, LLC	Manchester	NH	-71.452	42.976
M5336	Casa Di Bertacchi, LLC	Vineland	NJ	-75.058	39.538
M5338	Schonwetter Enterprises, Inc., DBA Bilinski's Sausage Mfg Co.	Cohoes	NY	-73.705	42.758
M5341	Brooklyn Provisions, Inc.	Carlstadt	NJ	-74.057	40.825
M5342	Seviroli Foods, LLC	Garden City	NY	-73.611	40.729
M5342B	Seviroli Foods, LLC	Hauppauge	NY	-73.261	40.82
M5344	Perrulli's Custom Meats Inc.	Toms River	NJ	-74.218	40.02
M535	Nduja di Spilinga USA, LLC	Seattle	WA	-122.335	47.602
M5351	Martin's Specialty Sausage Company Inc.	Mickleton	NJ	-75.251	39.807
M5363	Kirby and Holloway Provision Co.	Harrington	DE	-75.549	38.928
M5369	Numeat Packing, Inc.	San Juan	PR	-66.096	18.416
M5370	Whitsons Food Services (Bronx), LLC	Brooklyn	NY	-74.022	40.647
M537D	Kraft Heinz Foods Company	Davenport	IA	-90.61	41.617
M537G	Kraft Heinz Company	Coshocton	OH	-81.869	40.25
M537H	Kraft Heinz Foods Company	Columbia	MO	-92.267	39.01
M537L	Kraft Heinz Foods Company	Avon	NY	-77.753	42.907
M537V	Kraft Heinz Foods Company	Kirksville	MO	-92.589	40.22
M5381	Prime Foodservice, Inc.	Tewksbury	MA	-71.185	42.62
M5382	Cifelli Sausage LLC	Sayreville	NJ	-74.342	40.429
M5385	Gaiser's European Style Provisions Inc.	Union	NJ	-74.271	40.697
M53855	Chihuly	Long Island City	NY	-73.947	40.74
M53856	Five Marys Custom Meat Co.	Fort Jones	CA	-122.848	41.599
M53858	McLean Beef Inc	York	NE	-97.599	40.832
M53859	Chunwei Inc.	Ontario	CA	-117.608	34.047
M53861	Central Avenue Meats	Great Falls	MT	-111.3	47.505
M53863	Riverbend Meats, LLC	Idaho Falls	ID	-112.071	43.497
M53864	Midland Meat Packing NY, Inc.	Brooklyn	NY	-74.022	40.647
M53866	OSI Industries, LLC	West Chicago	IL	-88.262	41.867
M53869	1845 Smoked Meat Company, LLC	New Braunfels	TX	-98.09	29.713
M53872	Welch's Country Smokehouse, LLC	Macon	GA	-83.727	32.932
M53873	Hudson Lockers	Hudson	CO	-104.644	40.074
M53876	Blue Creek Marbled Meat Company LLC	Billings	MT	-108.425	45.673
M53877	Hat Creek Butchery	Plains	KS	-100.599	37.258
M53877A	Hat Creek Butchery	Liberal	KS	-100.921	37.068
M53878	Hannah International Foods, Inc.	Seabrook	NH	-70.872	42.894
M53881	Mucca, Inc.	Gardena	CA	-118.303	33.903
M53882	Kingdom Provisions	Pipersville	PA	-75.13	40.406
M5390A	North Country Smokehouse	Claremont	NH	-72.387	43.339
M5397	Vincent Giordano Corporation	Philadelphia	PA	-75.187	39.94
M54	Daniele Operating, LLC - Stedagio	Mapleville	RI	-71.642	41.947
M540	Mutual Beef Co., Inc.	Boston	MA	-71.067	42.33
M5401	Leidy's, LLC	Easton	PA	-75.226	40.741
M5402	Beef Burger Corp.	Guttenberg	NJ	-74.011	40.797
M541	Mar-View Farms LLC	Arabi	GA	-83.785	31.807
M5411	Schmalz European Provision Inc.	Springfield	NJ	-74.312	40.684
M5414	Pulaski Meat Products Company Inc.	Linden	NJ	-74.253	40.631
M5421	Spolem Provisions,LLC	Hamilton	NJ	-74.726	40.245
M5424	Dutch's Meats Inc	Ewing	NJ	-74.772	40.247
M54247	A Small Good, LLC	Hope	ME	-69.183	44.266
M54248	Tropic Star Seafood, Inc.	Lakeland	FL	-82.028	27.999
M54249	Victoria Livestock	Newark	NJ	-74.195	40.708
M5425	Salem Halal Meat Packaging, LLC	Salem	NJ	-75.437	39.553
M54251	Bagelinos	Rockaway	NJ	-74.518	40.895
M54253	Empanada Kitchen Happily Baked Corp	San Diego	CA	-117.208	32.756
M54259	Maestri d'Italia Inc.	Lakewood	NJ	-74.187	40.07
M54260	Chef Kern's Wholesale LLC	Cumming	GA	-84.081	34.253
M54261	Global Appetizers Inc.	Hillsborough	NJ	-74.64	40.492
M54263	Kerry, Inc	Commerce	GA	-83.459	34.266
M54267	HeBo Family Foods, Inc.	Providence	RI	-71.425	41.832
M54269	DuFour Gourmet	Long Island City	NY	-73.95	40.752
M5427	Marie Poggi Ravioli	Vineland	NJ	-74.938	39.504
M54271	Beef and Bacon	Calhoun	KY	-87.474	37.618
M5430	Bierig Brothers Inc.	Vineland	NJ	-75.054	39.539
M5439	Kleemeyer & Merkel Inc.	Green Village	NJ	-74.444	40.735
M544	Legacy Turkey	Melrose	MN	-94.794	45.676
M5444	Gardella's Ravioli Co. & Italian Deli LLC	Vineland	NJ	-74.974	39.508
M5452	Licini Brothers Food Company LLC	Union City	NJ	-74.04	40.759
M546	Ameristar Meats, Inc.	City of Spokane Valley	WA	-117.333	47.655
M54628	Metz Culinary Management	Sarasota	FL	-82.54	27.373
M54629	Deano's Pastacia, Inc.	Somerville	MA	-71.085	42.39
M54630	Rizzo's Malabar Inn, Inc.	Crabtree	PA	-79.473	40.363
M5476	G&M Co.	Newark	NJ	-74.172	40.746
M5477	Unity Beef Sausage Co., Inc.	Newark	NJ	-74.172	40.746
M5484	Lopes Sausage Co.	Newark	NJ	-74.161	40.726
M5489	New Jersey Veal Co., Inc.	Garfield	NJ	-74.117	40.879
M548A	Yosemite Foods Inc.	Stockton	CA	-121.221	37.931
M549	Tyson Foods, Inc.	Springdale	AR	-94.152	36.155
M5495	Saker Shoprites Inc	Linden	NJ	-74.232	40.649
M5497	Adams Farm Slaughterhouse LLC	Athol	MA	-72.2	42.595
M550	Sterling Pacific Meat Co.	Commerce	CA	-118.15	33.979
M5500	Tyson Prepared Foods, Inc.	Hutchinson	KS	-97.933	38.045
M5502	Ruwaldt Packing Co.	Hobart	IN	-87.257	41.551
M5503	Fritz's Superior Sausage Co.	Leawood	KS	-94.61	38.94
M5505	Conagra Brands (Conagra Foods Packaged Foods LLC)	Macon	MO	-92.47	39.737
M5511	Gibbon Packing, LLC	Gibbon	NE	-98.837	40.753
M5516	SFC Global Supply Chain, Inc.	Sidney	OH	-84.179	40.269
M5520	Nordic Foods Inc.	Kansas City	KS	-94.687	39.095
M5526A	Reinhart Foodservice, LLC	West Salem	WI	-91.07	43.897
M553	NationsMarket, LLC	Pembroke Park	FL	-80.178	25.989
M5533	West Liberty Foods, LLC	West Liberty	IA	-91.266	41.569
M5536	Banner Creek, LLC	Holton	KS	-95.727	39.462
M5537	Sioux-Preme Packing Co.	Sioux Center	IA	-96.177	43.035
M5538	General Mills, Inc.	Hannibal	MO	-91.412	39.681
M5540	Shamrock Meat Processing LLC	Waterloo	NE	-96.292	41.253
M5541A	Native American Enterprises, LLC	Wichita	KS	-97.389	37.687
M555	One World Specialties	Las Vegas	NV	-115.126	36.066
M5552	Roca, Inc.	Chicago	IL	-87.738	41.799
M5553	Del Gould Meats, Inc.	Lincoln	NE	-96.691	40.847
M5561A	Bar-W Meat Company, LLC	Fort Worth	TX	-97.297	32.768
M5562	S&S Quality Meats	Emporia	KS	-96.248	38.414
M5578	Arck Foods, Inc.	Lincoln	NE	-96.635	40.878
M5581	Westin, Inc. Fairbury Food Division	Fairbury	NE	-97.175	40.133
M5590	Ajinomoto Foods North America	Lampasas	TX	-98.177	31.067
M5593	Grabill Canning Company	Grabill	IN	-84.969	41.208
M56	Pilgrim's Pride Corporation	TIMBERVILLE	VA	-78.784	38.633
M560	Gentleman Sausages, LLC	Coeur d'Alene	ID	-116.781	47.674
M5617	Cargill Kitchen Solutions	Monticello	MN	-93.798	45.304
M562	JBS Green Bay, Inc.	Green Bay	WI	-87.985	44.48
M5622	Albion Locker	Albion	NE	-97.998	41.692
M5626	Byerly Foods International, Inc.	Lake Mills	IA	-93.533	43.429
M562M	JBS Plainwell, Inc.	Plainwell	MI	-85.647	42.421
M5630	SFC Global Supply Chain, Inc.	Pasadena	TX	-95.227	29.692
M5630D	SFC Global Supply Chain, Inc.	Deer Park	TX	-95.135	29.706
M5648	Lake Geneva Country Meats, Inc	Lake Geneva	WI	-88.35	42.594
M5650	Custom Pack Inc.	Hastings	NE	-98.389	40.567
M5652	Main Street Market	Humphrey	NE	-97.485	41.692
M5658	Loeffel Meat Laboratory / Animal Science Department	Lincoln	NE	-96.664	40.832
M5659	Schubert's Smokehouse Packing Co., Inc.	Millstadt	IL	-90.09	38.455
M565A	Montgomerys Meats Inc	Central Point	OR	-122.919	42.376
M565B	Montgomerys Meats Inc	Central Point	OR	-122.907	42.399
M5660	Willow Creek Meats	McCook	NE	-100.624	40.199
M5666	Quality Sausage Company, LLC	Dallas	TX	-96.859	32.771
M5666T	Quality Sausage QOZ, LLC	Dallas	TX	-96.859	32.77
M5668	Food Solutions 2, Inc.	Denver	CO	-104.85	39.787
M5674	Hastings Foods L.L.C.	Grand Island	NE	-98.38	40.913
M5686	Wausa Lockers Inc.	Wausa	NE	-97.538	42.499
M5687	Bay View Packing Company	Milwaukee	WI	-87.937	43.035
M5688	Ajinomoto Foods North America	Toluca	IL	-89.137	41.007
M569	MF Meats	Falconer	NY	-79.195	42.113
M5694	Kent Quality Foods Inc.	Grand Rapids	MI	-85.686	42.986
M5694A	Kent Quality Foods, Inc.	Hudsonville	MI	-85.869	42.838
M5696	AVF Holding LLC	Cuyahoga Falls	OH	-81.518	41.164
M5697	Swanson Meat Co.	Minneapolis	MN	-93.235	44.953
M5699	Richelieu Foods, Inc.	Beaver Dam	WI	-88.826	43.476
M5706	Giovanni's Appetizing Food Products, Inc.	Richmond	MI	-82.736	42.81
M5710A	Smithfield Packaged Meats Corp.	Harrison	OH	-84.775	39.233
M5712	Valley Meats LLC	Coal Valley	IL	-90.462	41.428
M5722	Toman's City Market	Clarkson	NE	-97.122	41.726
M5723	Fremont Meat Market, Inc.	Fremont	NE	-96.495	41.444
M5726	Fairbury Steaks, Inc.	Fairbury	NE	-97.181	40.136
M5729	Twin Loups Quality Meats	St Paul	NE	-98.46	41.213
M5742	Country Maid, Inc.	Milwaukee	WI	-87.91	43.009
M5754	Nestle USA, Inc.	Little Chute	WI	-88.324	44.285
M5766	Alewel's Country Meats	Warrensburg	MO	-93.736	38.778
M5777	University of Missouri Meat Market	Columbia	MO	-92.317	38.942
M5777A	University of Missouri Meat Market	Columbia	MO	-92.32	38.942
M5779	Green Hills Fresh Meats	Brookfield	MO	-93.041	39.794
M578	James Calvetti Meats, Inc.	Chicago	IL	-87.651	41.816
M5788	Liberty Locker	La Belle	MO	-91.91	40.114
M5789	Vocci Ravioli Company	Kansas City	MO	-94.572	39.108
M579	Jennie-O Turkey Store	Faribault	MN	-93.276	44.303
M5798	Williams Brothers Meat Market	Washington	MO	-91.011	38.552
M5798A	Williams Brothers Meat Co.	Washington	MO	-91.02	38.557
M580	A. Decoite Packing House, Inc.	Haiku, Maui	HI	-156.301	20.865
M5800	Di Gregorio Food Products, Inc.	St. Louis	MO	-90.273	38.614
M5805A	American Laboratories, LLC	Omaha	NE	-95.965	41.207
M5806	Cusack Wholesale Meats	Oklahoma City	OK	-97.518	35.453
M5808	Henningsen Foods, Inc.	Ravenna	NE	-98.911	41.024
M5813	DS OFOOD, Inc.	Schleswig	IA	-95.437	42.154
M5819	Gourmet Ranch	Houston	TX	-95.505	29.926
M582	The Hillshire Brands Company	Haltom City	TX	-97.289	32.822
M5833	Mo-Ark Provision Company Inc	Poplar Bluff	MO	-90.373	36.766
M5837	Simmons Prepared Foods, Inc.	Van Buren	AR	-94.358	35.433
M5839	Tyson Foods, Inc.	Russellville	AR	-93.086	35.27
M584	Pilgrim's Pride Corporation	Mount Pleasant	TX	-94.989	33.145
M5842	Tyson Foods, Inc.	Springdale	AR	-94.126	36.19
M5850A	Kraft Heinz Foods Company	San Diego	CA	-116.972	32.562
M5854	D&M Distributing	Ogden	UT	-112.009	41.21
M5860	Raven Brand Products	Armona	CA	-119.709	36.316
M5867A	Ohanyan's Inc.	Fresno	CA	-119.851	36.791
M5869	Choice Food Products Inc.	Fresno	CA	-119.833	36.76
M5883	Mountain Meadows Lamb Corporation	Denver	CO	-104.977	39.786
M5886	Goodman Food Products	Inglewood	CA	-118.352	33.967
M5886A	Goodman Food Products, Texas Inc.	Mansfield	TX	-97.133	32.572
M5889	A & S Produce Inc.	Vernon	CA	-118.186	33.999
M5891	E&H Distributing LLC	LAS VEGAS	NV	-115.145	36.179
M5898	Bot N Bot	Santa Fe Springs	CA	-118.054	33.947
M5903	American Skin Food Group LLC	Burgaw	NC	-77.92	34.543
M5903B	American Skin Food Group, LLC	Orange City	IA	-96.058	42.991
M5906	Al & John Inc.	West Caldwell	NJ	-74.3	40.855
M5907	Burger Maker Inc.	Carlstadt	NJ	-74.08	40.836
M5911	A&M Packing LLC	Newton	NJ	-74.79	41.062
M5912	Serra Sausage LLC	Vineland	NJ	-75.035	39.493
M5916	Longhini, LLC	New Haven	CT	-72.949	41.295
M5921	Arm National Foods	Trenton	NJ	-74.747	40.212
M5929	Wayne Meat Corporation	Wayne	NJ	-74.276	40.984
M5931	G.G. RUPPERSBERGER & SONS INC	BALTIMORE	MD	-76.644	39.312
M5934	A.F.I. Food Service LLC "DBA" PFS Metro NY Custom Cuts	Elizabeth	NJ	-74.171	40.671
M595	Old World Provisions Inc.	Troy	NY	-73.676	42.706
M5952	Lamberti Packing Company	New Haven	CT	-72.921	41.294
M5953	Italia Importing Company	New Haven	CT	-72.915	41.308
M5964	Minore's Meats, LLC	New Haven	CT	-72.944	41.316
M5967	City Line Distributors, LLC	West Haven	CT	-72.982	41.289
M597	Buckhead South Florida LLC	Medley	FL	-80.379	25.888
M5976	LaRosa Products	Hartford	CT	-72.676	41.737
M5981	Vineridge Inc.	Enfield	CT	-72.561	41.988
M5985	Litchfield Prime Meats & Provisions LLC	Litchfield	CT	-73.18	41.748
M5987	Rocko Meats	Thurmont	MD	-77.433	39.58
M599	M.A.D. Burgers and Sausage	Phoenix	AZ	-112.001	33.4
M5992	Noack's Meat Products, Inc.	Meriden	CT	-72.766	41.526
M5993	Martin Rosol's, Inc.	New Britain	CT	-72.787	41.671
M5998	Bristol Beef	Bristol	CT	-72.906	41.652
M6002	Provena Foods, Inc.	Lathrop	CA	-121.295	37.804
M6004	Wolf Pack Meats	Reno	NV	-119.734	39.513
M6006	Carlotta's Kitchen LLC	Tucson	AZ	-110.958	32.212
M6009	Ruiz Food Products, Inc.	Vernon	CA	-118.209	34.004
M6010T	National Steak Processors (2024), LLC.	Owasso	OK	-95.851	36.26
M6012	U. C. Davis Meat Laboratory	Davis	CA	-121.746	38.536
M6016	Papa Cantella's Inc	Vernon	CA	-118.207	33.999
M6018	Eureka Sausage Company	North Hollywood	CA	-118.379	34.195
M602	San Antonio Packing Company	San Antonio	TX	-98.514	29.411
M6022	Milan Salami Co.	Oakland	CA	-122.287	37.849
M6024	Courage Production, LLC	Fairfield	CA	-122.08	38.233
M6028	Meadow Farms Sausage Company	Los Angeles	CA	-118.309	33.983
M6028A	West Coast Prime Meats LLC	Brea	CA	-117.889	33.923
M6030	Evans Food Group	City of Industry	CA	-117.963	34.021
M6036	P.G. Molinari & Sons Inc.	San Francisco	CA	-122.388	37.725
M6037	Aries Beef LLC	Burbank	CA	-118.315	34.18
M6045	Valley Meat & Food LLC	Alamosa	CO	-105.875	37.464
M6052	CREATIVE FOOD PROCESSING	SANTA CLARA	CA	-121.959	37.365
M6056	Schenk Packing Company, Inc.	Stanwood	WA	-122.344	48.257
M6056A	Schenk Packing Company Warehouse	Mount Vernon	WA	-122.335	48.412
M6063A	Central Valley Meat Co., Inc.	Hanford	CA	-119.614	36.322
M6068	Evergood Sausage Company	San Francisco	CA	-122.388	37.727
M6070	Los Angeles Poultry	Los Angeles	CA	-118.243	34.0
M6072	Bangkok Meatball Corp.	Lynwood	CA	-118.214	33.939
M6074	Continental Gourmet Sausage	Glendale	CA	-118.288	34.166
M6075	E.C. Wilson Co., Inc.	Brier	WA	-122.26	47.798
M6076	Scotty's Country Smokehouse	Idaho Falls	ID	-112.009	43.537
M6076A	Glenwood Snacks LLC	Saint Anthony	ID	-111.686	43.947
M6076B	Scotty's Country Smokehouse	Idaho Falls	ID	-112.009	43.537
M6080	WEST BEST FOODS INC	LAS VEGAS	NV	-115.195	36.128
M6081	Great  River Food	City of Industry	CA	-117.879	33.999
M6086	Silva Sausage Co.	Gilroy	CA	-121.55	36.988
M6087	Victor's Market Co Inc	Hawthorne	CA	-118.344	33.927
M609	The XCJ Corp	Sumner	WA	-122.236	47.214
M6111	B & S Food Products	Walnut	CA	-117.859	34.012
M6117	Kanab Custom Meats, Inc.	Kanab	UT	-112.518	37.041
M6119	C.R. Meats	Oakland	CA	-122.277	37.829
M6124	Compass Foods, Inc.	Modesto	CA	-120.996	37.621
M6133	Daily's Premium Meats, LLC	Salt Lake City	UT	-111.905	40.694
M6136	A.J. Sons, Inc.	Laguna Beach	CA	-117.764	33.564
M6137	Foster Poultry Farms, LLC	Livingston	CA	-120.731	37.396
M6137B	Foster Poultry Farms, LLC	Livingston	CA	-120.731	37.396
M6138	Gelsinger Meats, Inc.	Montrose	CA	-118.226	34.205
M6140	Golden Farms	Canoga Park	CA	-118.6	34.2
M6147	Overhill Farms, Inc.	Vernon	CA	-118.224	34.006
M6149	Central Meat and Provision Company	San Diego	CA	-117.15	32.704
M6152	S.A. Piazza & Associates, LLC	Clackamas	OR	-122.556	45.408
M6152A	S.A. Piazza & Associates Inc.	Clackamas	OR	-122.535	45.407
M6153	M Group Industries	Spring Valley	CA	-116.966	32.727
M6154	Caggiano Company	Sebastopol	CA	-122.811	38.385
M6156	Garo's Basturma	Pasadena	CA	-118.113	34.165
M6161	Colorado Custom Meat Company, LLC	Kersey	CO	-104.561	40.386
M6172	Taylor's Sausage, Inc.	Cave Junction	OR	-123.652	42.165
M6173	Masami Foods, Inc.	Klamath Falls	OR	-121.778	42.179
M6184	January Foods Corp	Kent	WA	-122.264	47.427
M6202	Payless Distribution Center (PDC)	Dededo	GU	144.825	13.502
M6203	Old Trapper Smoked Products, Inc.	Forest Grove	OR	-123.075	45.526
M6203A	Old Trapper Smoked Products, Inc.	Forest Grove	OR	-123.076	45.526
M6206	Fabrique Delices, LLC	Hayward	CA	-122.063	37.613
M6208	Hawaii Meats, LLC	Kapolei	HI	-158.093	21.298
M6211A	Baxters North America	Salem	OR	-123.053	44.946
M6211K	Baxters North America	East Bernstadt	KY	-84.128	37.177
M6214	Stone Meat Inc	Pleasant View	UT	-112.021	41.324
M6217	South Gate Meat Company	South Gate	CA	-118.217	33.951
M6218	Burnett & Son Meat Co., Inc.	Monrovia	CA	-118.0	34.136
M6220A	Idaho Smokehouse Partners LLC	Shelley	ID	-112.121	43.394
M6229	John's Sandwich Shop Inc	Butte	MT	-112.536	46.011
M623	Tyson Prepared Foods, Inc.	South Hutchinson	KS	-97.943	38.029
M6232	Ready Foods, Inc.	Denver	CO	-104.931	39.773
M6232B	Ready Foods	Denver	CO	-104.919	39.776
M6236	Flocchini Family Provisions, Inc.	Carson City	NV	-119.764	39.181
M6239	Shamrock Foods Company	Phoenix	AZ	-112.123	33.477
M6246	Ramona's Food Group	Gardena	CA	-118.31	33.908
M6248	Plano Jerky	Porterville	CA	-119.008	36.053
M6250	JBS USA	Denver	CO	-105.016	39.717
M6251	Jobbers Meat Packing Co Inc	Los Angeles	CA	-118.207	33.996
M6252	Pontrelli & Laricchia LLC	Vernon	CA	-118.205	33.986
M6264	Harrisville Cannery	Harrisville	UT	-111.981	41.267
M6266	LJD Holdings, Inc.	Boise	ID	-116.193	43.571
M6267	Interbay Food Company	Woodinville	WA	-122.147	47.767
M6270	Royal Pack LLC	Basin City	WA	-119.135	46.583
M6271	Stillwater Packing Co.	Columbus	MT	-109.277	45.668
M6273	House Of Smoke, Inc.	Fort Lupton	CO	-104.811	40.087
M628	Swift Beef Company	Hyrum	UT	-111.86	41.644
M6281	Russak's Cured & Smoked Products	Los Angeles	CA	-118.226	34.044
M6292	Venus Foods Inc.	City of Industry	CA	-117.951	34.011
M630	CS Beef Packers, LLC	Kuna	ID	-116.275	43.445
M6308	Zenner's Quality Meat Products, Inc.	Wilsonville	OR	-122.771	45.316
M6313	Savenor's Supply Company, Inc.	Chelsea	MA	-71.024	42.389
M6335	Crocetti's Oakdale Packing Company, Inc.	East Bridgewater	MA	-70.984	42.04
M6336	Crocetti's Oakdale Packing	Brockton	MA	-71.002	42.08
M635	Cargill Meat Solutions Corporation	Waco	TX	-97.123	31.609
M6354	E.L. Blood & Son, Inc.	West Groton	MA	-71.621	42.601
M6358	South Coast Gormet Sausage, Inc.	Fall River	MA	-71.135	41.689
M6360	Zonin's Meats Inc.	Springfield	MA	-72.583	42.098
M6363	Chicopee Provision Co., Inc.	Chicopee	MA	-72.613	42.157
M6365	John & Sons	Worcester	MA	-71.786	42.258
M6373	Grossglockner Inc.	Canandaiqua	NY	-77.304	42.902
M6373B	Grossglockner, Inc.	Canadaigua	NY	-77.314	42.908
M6387	Mayabeque Products Corp.	North Bergen	NJ	-74.008	40.799
M639	Carteret Abattoir	Carteret	NJ	-74.229	40.571
M6393	DePasquales Sausage	Newton	MA	-71.2	42.361
M6396	Dom's Sausage Co., Inc.	Malden	MA	-71.075	42.421
M6402A	Perdue Foods LLC	Mount Vernon	WA	-122.333	48.392
M6405	GBS Partners, Inc.	Louisville	CO	-105.122	39.963
M6407	Laurienti & LaBate Meat, Inc.	Denver	CO	-104.978	39.829
M6410	Hempler Foods Group LLC	Ferndale	WA	-122.583	48.839
M642	Vietti Foods Company, Inc	Nashville	TN	-86.772	36.137
M6423	Rainier Pure Beef Company	Woodland	WA	-122.744	45.892
M6424	Fischer Meats	Issaquah	WA	-122.037	47.531
M6426	Tcm, Inc.,	Olympia	WA	-122.846	47.037
M6432	Continental Sausage, Inc.	Denver	CO	-104.975	39.834
M6433	S'Kallam Meat & Seafood, LLC	Bremerton	WA	-122.68	47.56
M6437	Evergreen Meats Inc.	Port Angeles	WA	-123.442	48.12
M6444	Angus Meats, Inc.	Spokane	WA	-117.387	47.684
M645	Konanyan Meat Company, Inc. / Western Gourmet	Los Angeles	CA	-118.267	34.135
M6454	Elizabeth Locker Plant, Inc.	Elizabeth	CO	-104.596	39.362
M6456	F & M Sausage Co.	Pueblo	CO	-104.575	38.245
M6460	Scanga Meat Company	Salida	CO	-106.01	38.553
M6463	Praire Meats, LLC	Brush	CO	-103.596	40.161
M6467	Steele's Meat Co. LLC	Lafayette	CO	-105.107	40.001
M6474	Polidori Meat Processors Inc.	Denver	CO	-104.931	39.77
M6476	Tico's Mexican Foods	Denver	CO	-104.99	39.68
M6479	Mr. J's Tamales & Chili, Inc.	Lynwood	CA	-118.226	33.934
M6482	York Meats	Fallon	NV	-118.83	39.486
M6492	Foster Poultry Farms LLC	Compton	CA	-118.217	33.909
M6496	Prairie Meats LLC	Brush	CO	-103.624	40.252
M6498	Cacique, Inc.	Cedar City	UT	-113.07	37.69
M64A	Fred's Meat and Processing	Ashley	IL	-89.204	38.33
M650	Grateful Pastures, LLC	Mansfield	GA	-83.759	33.436
M6507	Hartman Enterprises Inc. DBA Hartman Meat Co.	Hyattsville	MD	-76.927	38.924
M6515	Family Brands, LLC	Lenoir City	TN	-84.257	35.79
M6519	Crider, Inc.	Stillmore	GA	-82.214	32.429
M6524	Embutidos Don Frank	Carolina	PR	-65.982	18.403
M6526	Blue Ridge Meats of Front Royal	Middletown	VA	-78.216	38.973
M6533	VIE DE FRANCE YAMAZAKI, INC	ALEXANDRIA	VA	-77.104	38.808
M6537	University of Florida Meat Lab	Gainesville	FL	-82.352	29.631
M654	Alpha Foods Co.	Waller	TX	-95.948	30.054
M6548	Century Titan, LLC	Catano	PR	-66.143	18.433
M6551	Mack's Liver Mush, Inc.	Shelby	NC	-81.701	35.396
M6554	Wells Processing Plant	Brighton	TN	-89.72	35.484
M6555	Fayette Packing Company, Inc.	Eads	TN	-89.583	35.219
M6561	Volunteer Meats LLC	Lexington	TN	-88.279	35.632
M6561A	Simpson's Meats	Knoxville	TN	-84.146	35.915
M6566	Bagel Bites	Ft Myers	FL	-81.803	26.665
M6568	St. Clair Foods Inc.	Memphis	TN	-90.026	35.064
M6572	Lawson Institutional Foods	Waco	GA	-85.239	33.656
M6574	GWB, LLC	Fort Lauderdale	FL	-80.144	26.085
M6576	B&B Foods	Kuttawa	KY	-88.121	37.072
M6585	Hopkins Poultry Co., Inc.	Browns Summit	NC	-79.723	36.216
M6590	Harpley's Meat Packing Inc.	Asheboro	NC	-79.814	35.747
M6593	Alexander's Ham Co.	China Grove	NC	-80.681	35.573
M6596	Tripp Country Ham Inc.	Brownsville	TN	-89.262	35.592
M6599	Star Food Products, Inc.	Burlington	NC	-79.441	36.091
M6608	Bighams Ham Company	Cornersville	TN	-86.746	35.294
M6613	Tennesse Valley Packing Co., Inc.	Columbia	TN	-87.031	35.621
M6621	Dean Sausage Company, Inc.	Attalla	AL	-86.125	33.988
M6621A	Kentucky Farm Kitchens	Attalla	AL	-86.124	33.986
M6636	Pete's Country Meats	Loretto	TN	-87.391	35.06
M6639	A.L. Beck & Sons, Inc.	Winston-Salem	NC	-80.211	36.006
M664	Buckhead Meat Company	Warwick	RI	-71.446	41.731
M6640	Kabobs Aquisition, LLC	Lake City	GA	-84.336	33.607
M6644	Conecuh Sausage	Andalusia	AL	-86.457	31.338
M6645	Carolina Fresh Foods	Florence	SC	-79.776	34.198
M6648	Blue Ridge Meats	Rabun Gap	GA	-83.358	34.971
M6653	Miami Beef Co., Inc.	Miami	FL	-80.279	25.916
M6654	Jenkins Foods, Inc.	Shelby	NC	-81.691	35.391
M6660	Pender Packing Company, Inc.	Rocky Point	NC	-77.956	34.424
M6662	Kenosha Beef International	Norcross	GA	-84.206	33.916
M6668	Morty Pride Meats, Inc.	Fayetteville	NC	-78.794	35.033
M667	Mountaire Farms Inc.	Selbyville	DE	-75.228	38.46
M6670	Stanton's Bar-B-Q	Bennettsville	SC	-79.666	34.733
M6678	Ganaderia Santiago Inc.	Yauco	PR	-66.884	18.025
M6682	Ganaderos Alvarado, Inc.	Arecibo	PR	-66.707	18.417
M669	(Lebanon) - Godshall's Quality Meats, Inc.	Lebanon	PA	-76.394	40.357
M6697	Bryant's Meat Inc	Taylorsville	MS	-89.443	31.834
M6699	CFCM "DBA" Hobe's Country Hams, Inc.	North Wilkesboro	NC	-81.168	36.227
M6707	Century Packing Corp.	Las Piedras	PR	-65.88	18.189
M6715	Beaver Street Fisheries, Inc.	Jacksonville	FL	-81.689	30.336
M6717	EuroCaribe Packing Company	Vega Baja	PR	-66.389	18.452
M6720	Martin's Pork Products, Inc.	Falcon	NC	-78.655	35.189
M6725	Copper Cellar Corp	Knoxville	TN	-83.968	35.978
M6726	Johnson Bros Wholesale Meats I	Panama City	FL	-85.65	30.178
M6729	Provimi de Puerto Rico, Inc.	Morovis	PR	-66.425	18.338
M6733	Jack Packaging, Inc.	Ciales	PR	-66.479	18.336
M6744	Segarra's Sausage	Moca	PR	-67.066	18.365
M6747	D. L. Lee & Sons (Establishment 6747/P-6747)	Alma	GA	-82.44	31.538
M675	Caviness Beef Packers, Ltd.	Hereford	TX	-102.472	34.761
M676	RRR Meat Processing	Buckley	MI	-85.686	44.489
M6761	Italia Foods, Inc	Schaumburg	IL	-88.058	42.071
M6761A	Italia Foods	Schaumburg	IL	-88.06	42.068
M6765	Wichita Packing Company	Chicago	IL	-87.685	41.888
M6775	Calihan Processing Cooperative	Peoria	IL	-89.612	40.674
M6785	BEF Foods, Inc.	Xenia	OH	-83.914	39.68
M679	Westville Meat Market & Processing LLC	Westville	FL	-85.852	30.764
M6791	Knaus Sausage House	Kimball	MN	-94.301	45.313
M6796	Oriental Kitchen Corp.	Chicago	IL	-87.665	41.886
M6797	Ogden Foods, LLC	Chicago	IL	-87.732	41.848
M6798	Park 100 Foods, LLC	Tipton	IN	-86.037	40.28
M6803	Karn Meats, Inc.	Columbus	OH	-82.96	39.986
M6806	Morgan Foods, Inc.	Austin	IN	-85.808	38.746
M6810	Meats By Linz	Hammond	IN	-87.513	41.627
M6813	Supreme Tamale Company	Elk Grove Village	IL	-87.963	42.017
M6814	Stehouwer's Frozen Foods, Inc.	Grand Rapids	MI	-85.709	43.002
M6823	J. Brodie Meat Products, Inc.	Galesburg	IL	-90.38	40.931
M6829A	Burke Marketing Corporation	Nevada	IA	-93.439	42.008
M6835	CBQ, LLC (DBA Carl Buddig and Company)	South Holland	IL	-87.623	41.612
M6837	Turri's Italian Foods, Inc.	Roseville	MI	-82.949	42.517
M6838	Queen City Sausage & Provision, Inc	Cincinnati	OH	-84.536	39.131
M6839	Frozen Specialties, Inc.	Archbold	OH	-84.297	41.516
M6844	Makowski's Real Sausage Company	Lansing	IL	-87.545	41.592
M686	Central Falls Provisions Co., Inc.	Central Falls	RI	-71.383	41.891
M6863	Smithfield Packaged Meats Corp.	Peru	IN	-86.026	40.719
M6867	Battaglia Distributing Co Inc	Chicago	IL	-87.665	41.846
M687	Albert Lea Select Foods Inc.	Albert Lea	MN	-93.348	43.68
M6872	John R Morreale Meat Inc.	Bedford Park	IL	-87.797	41.773
M6873	Dorina/So-Good, Inc.	Union	IL	-88.535	42.234
M6882	Park 100 Foods, LLC	Kokomo	IN	-86.137	40.503
M6899	AMPC, LLC.	Lytton	IA	-94.86	42.422
M6902	JBS Prepared Foods, Inc	Elkhart	IN	-85.935	41.649
M6911	The Hillshire Brands Company	Zeeland	MI	-86.027	42.919
M6915	White Castle System, Inc.	Orleans	IN	-86.454	38.647
M6916	Amity Packing Co. Inc.	Chicago	IL	-87.733	41.816
M6922	Zick's Specialty Meats, Inc.	Berrien Springs	MI	-86.338	41.949
M6923	Aurelio's Quality Products	Mokena	IL	-87.835	41.54
M6933	Dina Mia Group LLC	Iron River	MI	-88.643	46.095
M6934	Stap Inc.	Wheeling	IL	-87.911	42.123
M6935	Conagra Brands (Conagra Foods Packaged Foods LLC)	Macomb	MI	-82.97	42.674
M6939	National Coney Island Chili Co., Inc.	Roseville	MI	-82.966	42.501
M694	Kansas State University	Manhattan	KS	-96.578	39.195
M6944	Fontanini Foods, LLC	McCook	IL	-87.838	41.799
M6945	Butterfield Foods, LLC	Noblesville	IN	-86.027	40.045
M6961	Pohlmans Meat Processing Plant	Terre Haute	IN	-87.512	39.303
M6962	Meat Science Laboratory, Univ. of IL	Urbana	IL	-88.223	40.099
M6964	Bende & Son Salami Co. Inc.	Vernon Hills	IL	-87.943	42.216
M7000	Alma Foods, LLC	Alma	KS	-96.289	39.011
M7011	Creative Specialty Food Solutions, LLC	Houston	TX	-95.343	29.801
M7036	Yan Wholesale, Inc.	Sacramento	CA	-121.473	38.534
M705	Nestle Professional North America	Trenton	MO	-93.61	40.08
M7050	Dalhart Meats, LLC	Dalhart	TX	-102.496	36.054
M7055	Brown's Meat Locker	Stratford	TX	-102.064	36.322
M7066	J Bar B Foods	Waelder	TX	-97.298	29.692
M7066A	J Bar B Foods	Weimar	TX	-96.802	29.699
M7067	1st Original Texas Chili Company, Inc.	Fort Worth	TX	-97.349	32.806
M7075	TFSP, LLC	Van Buren	AR	-94.333	35.422
M7079	Bueno Foods	Albuquerque	NM	-106.654	35.065
M7091A	Pilgrim's Pride Corporation	Mount Pleasant	TX	-94.983	33.146
M710	Allen Brothers - Texas	Dallas	TX	-96.88	32.68
M7100	Tyson Foods, Inc.	Nashville	AR	-93.847	33.928
M7107	Martinez Brand Cracklings LLC	El Paso	TX	-106.486	31.754
M7124	West Texas A&M University Meat Laboratory	Canyon	TX	-101.91	34.992
M7138	Valley Meat Supply	Valley City	ND	-98.021	46.919
M7147	4G Meat Processing LLC	Kansas City	MO	-94.552	39.118
M7159	Greer's Ranch House Sausage, LLC	Pryor	OK	-95.329	36.279
M7168	Manuel's Odessa Tortilla & Tamale Factory, Inc.	Odessa	TX	-102.345	31.856
M717	Smithfield Fresh Meats Corp.	Denison	IA	-95.36	42.028
M7177	Kelly's Bar-B-Que, Inc.	Waco	TX	-97.164	31.57
M717C	Smithfield Packaged Meats Corp.	Carroll	IA	-94.86	42.062
M717CR	Smithfield Fresh Meats Corp.	Crete	NE	-96.963	40.578
M717M	Smithfield Fresh Meats Corp.	Monmouth	IL	-90.642	40.928
M717W	Smithfield Packaged Meats Corp.	Wichita	KS	-97.382	37.652
M7184M	Double B Foods, Inc.	Meridian	TX	-97.657	31.924
M7189	Ponderosa Meat Co.	Reno	NV	-119.806	39.512
M7190	Hausman Foods (2024), LLC	Corpus Christi	TX	-97.441	27.782
M7195	Speedy Foods LLC	Commerce City	CO	-104.906	39.786
M7202	Sugar Creek Packing co.	Frontenac	KS	-94.723	37.454
M7204	El Merendero Posa's	Santa Fe	NM	-105.963	35.639
M7211	Tyson Foods, Inc.	Berryville	AR	-93.567	36.371
M7217	Farm Fresh Food Suppliers, Inc.	Amite	LA	-90.551	30.725
M7221	Tyson Foods, Inc.	Rogers	AR	-94.121	36.318
M7226	Bear Creek Smokehouse	Marshall	TX	-94.503	32.616
M7231	HEB Meat Plant	San Antonio	TX	-98.404	29.475
M7232	New Mexico Mexican Foods	Las Cruces	NM	-106.769	32.309
M7237	Columbia Packing Co., Inc.	Ennis	TX	-96.618	32.31
M724	Coast Packing Company	Vernon	CA	-118.215	34.006
M7243	Smokey Denmark Sausage Company	Austin	TX	-97.704	30.254
M7246A	Rodriguez Foods Ltd.	Fort Worth	TX	-97.338	32.797
M7251	Mennonite Central Committee U.S.	Manheim	PA	-76.393	40.218
M7251A	Goshen, IN Canning Project	Goshen	IN	-85.85	41.592
M7251B	Mennonite Central Committee U.S.	Hydro	OK	-98.58	35.545
M7251C	Mennonite Central Committee	Henderson	NE	-97.808	40.779
M7251E	MCC Central States	North Newton	KS	-97.344	38.079
M7251F	Mennonite Central Committee U.S.	Wellman	IA	-91.843	41.54
M7255	Tyson Foods, Inc.	Fort Smith	AR	-94.41	35.396
M7271	C & L Foods, Inc.	Dallas	TX	-96.827	32.791
M7273	Panhandle State University	Goodwell	OK	-101.64	36.592
M7279	Pedro's Foods LLC	Lubbock	TX	-101.843	33.519
M7282	Caviness Beef Packers, Ltd.	Amarillo	TX	-101.848	35.122
M7287	Thompson Packers, Inc.	Slidell	LA	-89.782	30.295
M7293	Evans Food Group	Arlington	TX	-97.047	32.751
M7301	C&S Wholesale Meat Co.	Atlanta	GA	-84.364	33.728
M7302	Dean Commissary LP	Antioch	TN	-86.683	36.072
M7303	CFCM, LLC	Paris	TN	-88.291	36.277
M7303A	CFCM, LLC	Scottsville	KY	-86.174	36.747
M7305	Critchfield Meats, Inc.	Lexington	KY	-84.518	38.085
M7308A	Uncle Charlie's Meats	Richmond	KY	-84.282	37.75
M7317	Ross and Ross Grocery	Tompkinsville	KY	-85.692	36.701
M7322	Foster Poultry Farms, LLC	Demopolis	AL	-87.833	32.477
M7333	Manchester Farms, Inc.	Hopkins	SC	-80.873	33.905
M7340	Foothills Country Hams & Fresh Meats	Jonesville	NC	-80.832	36.222
M7341	Winningham's Meats	Ridgeville	SC	-80.204	33.137
M7345	Butterball, LLC	Mount Olive	NC	-77.914	35.14
M7353	Colorado Boxed Beef Co.	Lakeland	FL	-81.946	28.048
M7356	Dinos Farm LLC	Warsaw	KY	-84.785	38.82
M7359	Elaboracion Felo, Inc.	Aguadilla	PR	-67.156	18.42
M7360	Productos La Aguadillana, Inc.	Aguadilla	PR	-67.148	18.461
M7361	DeOro Foods LLC	Reidsville	NC	-79.652	36.331
M737	House of Raeford - Wallace Div	Teachey	NC	-78.051	34.756
M738	Bimmy's Food Made With Love	Long Island City	NY	-73.932	40.742
M74	Fisher Packing Company	Redkey	IN	-85.166	40.345
M7400	Moonlite Bar-B-Q Inn, Inc.	Owensboro	KY	-87.149	37.757
M7413	Elevation Foods, LLC	Knoxville	TN	-83.85	36.028
M7415	HOFFMAN'S QUALITY MEATS	HAGERSTOWN	MD	-77.753	39.677
M7417	Blue Grass Provisions Co. Inc.	Crescent Springs	KY	-84.586	39.047
M7420	Honest Meats, LLC	Harrisonburg	VA	-78.863	38.465
M7421A	University of Georgia Meat Plant	Athens	GA	-83.369	33.936
M7424	Pilgrim's Pride Corporation	Elberton	GA	-82.838	34.098
M7428	Joyce Foods, Inc.	Winston Salem	NC	-80.374	36.041
M7429	Hampton Premium Meats	Hopkinsville	KY	-87.456	36.84
M7431	Goodnight Brothers Produce Co., Inc.	Boone	NC	-81.644	36.221
M7439	Cheney OFS, Inc.	Greensboro	NC	-79.973	36.087
M744	Vineland Poultry LLC	Vineland	NJ	-75.063	39.472
M7442	Turner Hams LLC	Fulks Run	VA	-78.908	38.66
M7446	Rudolph Foods Company, Inc	New Hebron	MS	-89.989	31.741
M7447	Metrolina Meats	Indian Trail	NC	-80.637	35.066
M745	Purely Meat Purveyors LLC.	Forest Park	IL	-87.811	41.854
M7455	Williams Sausage Company, Inc.	Union City	TN	-89.162	36.479
M7457	Buzz Products, Inc.	Charleston	WV	-81.56	38.288
M7457A	Appalachian Abattoir	Charleston	WV	-81.56	38.288
M7460	Waltkoch LTD	Gainesville	GA	-83.824	34.274
M7464	F.B. Purnell Sausage Company Inc.	Simpsonville	KY	-85.35	38.223
M7467	Specialty Foods Group, LLC	Owensboro	KY	-87.133	37.778
M7470	Mountaire Farms Inc. - NC Division	Lumber Bridge	NC	-79.106	34.868
M7471	State Street Poultry & Provisions, LLC	Baltimore	MD	-76.645	39.269
M7478	Tyson Foods, Inc.	Wilkesboro	NC	-81.163	36.144
M7478AA	Tyson Foods, Inc.	Wilkesboro	NC	-81.162	36.144
M748	Square H Brands, Inc.	Los Angeles	CA	-118.22	34.012
M7483	Saval Foods Corporation	Baltimore	MD	-76.559	39.299
M7483A	Deli Brands of America	BALTIMORE	MD	-76.671	39.256
M7483B	1932 Specialty Produce and Meat	Elkridge	MD	-76.752	39.196
M748A	Square-H Brands, Inc.	Vernon	CA	-118.206	34.006
M7491	Carey & Schnalzer's Quality Meats (Slate Belt Butchery)	New Tripoli	PA	-75.749	40.693
M751	Pitman Farms Inc. (Moroni Turkey Processing)	Moroni	UT	-111.59	39.52
M751A	Pitman Farms Inc. (Salina Processing Plant)	Salina	UT	-111.869	38.955
M7527	Rafka Foods, Inc.	Aliquippa	PA	-80.268	40.592
M754	LuLu Commercial Kitchen	Maryland Heights	MO	-90.441	38.709
M7543B	Fratelli Beretta USA, Inc.	Mount Olive	NJ	-74.728	40.9
M7559	David Elliot Poultry Farm Inc.	Scranton	PA	-75.682	41.389
M7562	Dealaman Enterprises Inc.	Warren	NJ	-74.521	40.637
M7567	Wegmans Food Markets	Rochester	NY	-77.699	43.12
M756A	The Hillshire Brands Company	St Joseph	MO	-94.758	39.758
M757	The Hillshire Brands Company	Storm Lake	IA	-95.184	42.639
M7573	Hans Kissle Company, LLC	Haverhill	MA	-71.124	42.79
M7575	Daman Distributing Company Inc.	Boston	MA	-71.067	42.329
M760	Smithfield Packaged Meats Corp.	Des Moines	IA	-93.586	41.581
M7602	M&W Beef Packers Inc.	Mandan	ND	-100.895	46.832
M7603	Cloverdale Foods Co.	Mandan	ND	-100.932	46.857
M7610	Fargo Packing Company	West Fargo	ND	-96.896	46.876
M7611	Casselton Cold Storage Inc.	Casselton	ND	-97.212	46.901
M7615	Fairmount Lockers	Fairmount	ND	-96.605	46.055
M7622	Langdon Locker, LLC	Langdon	ND	-98.373	48.757
M7627	North Dakota State University Meat Laboratory	Fargo	ND	-96.81	46.893
M763	The Butcher's Block	Dry Fork	VA	-79.461	36.745
M7633	Ideal Meat LLC	Northridge	CA	-118.534	34.229
M7641	Myers Meats And Specialties	Parshall	ND	-102.085	47.769
M7644	Yellowstone River Beef	Williston	ND	-103.603	48.139
M7645K	Schwan's Food Company Global Supply Chain, Inc.	Florence	KY	-84.636	38.975
M765	Leon's Fine Foods	McKinney	TX	-96.626	33.223
M7650	Missouri River Meats	Great Falls	MT	-111.266	47.515
M7652	Bavaria Sausage of Wisconsin, Inc.	Madison	WI	-89.484	43.007
M7679	Ranchers' Best Meats	Miles City	MT	-105.806	46.445
M7681	Phu Huong Food Company, Inc.	Rosemead	CA	-118.073	34.063
M7693	J & J Snack Foods Handheld Corp.	Weston	OR	-118.427	45.819
M7696	Mattern Sausage	Orange	CA	-117.859	33.804
M7697	Castle Rock Meats, Inc.	Denver	CO	-104.977	39.788
M77	Maid-Rite Specialty Foods, Inc.	Dunmore	PA	-75.614	41.436
M7704	Riley's Meats	Butte	MT	-112.538	46.013
M7706	Georgetown Lake Holdings LLC	Anaconda	MT	-112.95	46.13
M7714	Carmine Lonardo's Inc.	Lakewood	CO	-105.081	39.69
M7716	BPM Fine Foods	Redwood City	CA	-122.206	37.482
M7717	White's Wholesale Meats	Ronan	MT	-114.064	47.53
M7718	Glacier Processing Cooperative	Columbia Falls	MT	-114.164	48.312
M7719	La Joya Products	Los Angeles	CA	-118.205	34.03
M772	Lombardi Brothers Meats LLC	Denver	CO	-104.916	39.775
M7721A	Nestle USA - Prepared Foods Division, Inc.	Mt. Sterling	KY	-83.906	38.095
M7722	Smith Meat Company, LLC	Rigby	ID	-111.9	43.688
M7725	Huong Duyen Meat Products	Lakewood	CO	-105.073	39.741
M7738	MGH Gourmet Inc.	Rancho Dominguez	CA	-118.21	33.867
M7748	Colorado Homestead Ranches, Inc.	Delta	CO	-108.08	38.741
M7748A	Colorado Homestead Ranches	Delta	CO	-108.079	38.742
M7750	General Mills Operations, Inc.	Wellston	OH	-82.538	39.09
M7761	Park 100 Foods, LLC	Morristown	IN	-85.683	39.676
M7766	Deli Star	St. Louis	MO	-90.226	38.624
M7777	Minnesota Meat Masters	Annandale	MN	-94.109	45.259
M7779	Randolph Packing Company	Streamwood	IL	-88.177	42.005
M7780A	Urban Farmer, LLC	Manteno	IL	-87.815	41.245
M7785	Huettl's Locker & Dressing Plant	Lake City	MN	-92.288	44.463
M7787	Institution Food House, Inc.	Fairfield	OH	-84.497	39.334
M77A	Maid-Rite Specialty Foods, Inc.	Scranton	PA	-75.663	41.404
M7804	Westerly Packing, Inc.	Westerly	RI	-71.836	41.4
M7809	Dakin Farm Inc.	Ferrisburg	VT	-73.23	44.243
M7812	Finger Food Products, LLC	Sanborn	NY	-78.92	43.114
M7817	US Foods Inc	Blasdell	NY	-78.799	42.798
M783	Harris Ranch Beef Company	Selma	CA	-119.616	36.498
M7831	Milmar Food Group II, LLC	Goshen	NY	-74.36	41.399
M7839	Kayem Foods Inc.	Chelsea	MA	-71.04	42.392
M7856	Viet My Corporation, Inc.	Woodbridge	VA	-77.255	38.626
M7856A	Viet My Corporation, Inc.	Woodbridge	VA	-77.255	38.627
M7857	Marcho Farms, Inc.	Souderton	PA	-75.356	40.307
M7875	Joe Jurgielewicz & Son, Ltd.	Hamburg	PA	-76.02	40.526
M7877A	Rastelli	Swedsboro	NJ	-75.377	39.752
M7877B	Rastelli Global	Swedesboro	NJ	-75.365	39.769
M7878	Thumann Inc.	Carlstadt	NJ	-74.071	40.83
M788	Aurora Packing Company, Inc.	North Aurora	IL	-88.32	41.8
M7882	Horst Meats	Hagerstown	MD	-77.752	39.703
M7883	Cooperativa de Porcinocultores de Puerto Rico y el Caribe	Guaynabo	PR	-66.103	18.333
M7885	A&S & Son	Keansburg	NJ	-74.13	40.442
M7886	K & K Gourmet Meats, Inc.	Leetsdale	PA	-80.219	40.572
M7899	Hofmann Sausage	Syracuse	NY	-76.091	43.095
M790	Plantation Processing LLC	Marshville	NC	-80.374	35.135
M7900	Prestige Farms, Inc.	Charlotte	NC	-80.745	35.266
M7906	Wholesome Foods, Inc.	Edinburg	VA	-78.59	38.821
M7909	G.A. Food Services of Pinellas County, LLC	St. Petersburg	FL	-82.676	27.883
M791	Clemens Food Group, LLC	Hatfield	PA	-75.322	40.269
M7914	Creation Gardens	Louisville	KY	-85.506	38.275
M7916	Chairman's Foods LLC	Nashville	TN	-86.709	36.145
M791C	Clemens Food Group, LLC	Coldwater	MI	-84.965	41.978
M791N	Clemens Food Group, LLC	Hatfield	PA	-75.315	40.268
M7928	Halpern's Steak and Seafood	Baltimore	MD	-76.626	39.28
M7929	Penn's Hams	Campbellsville	KY	-85.213	37.365
M794	Hometown Food Company	Milton	PA	-76.856	41.012
M7942	Gino's Bar-B-Q Inc	Smithville	TN	-85.836	35.96
M7945	Southern Packing Corp.	Chesapeake	VA	-76.202	36.577
M795	Monogram Meat Snacks, LLC	Martinsville	VA	-79.871	36.731
M7953	Southeastern Meats, Inc.	Chattanooga	TN	-85.191	35.033
M7958	Knott's Wholesale Foods	Paris	TN	-88.32	36.304
M795B	Monogram Snacks	Martinsville	VA	-79.874	36.728
M7964	Columbia Meats. Inc.	West Columbia	SC	-81.11	33.947
M7966A	NEW B & M Meats, Inc.	Wilmington	DE	-75.538	39.735
M7968	Minard's Spaghetti Inn, Inc.	Clarksburg	WV	-80.319	39.279
M7975	Piedmont Custom Meats, Inc.	Gibsonville	NC	-79.521	36.254
M7975A	Piedmont Custom Meats, Inc.	Asheboro	NC	-79.844	35.684
M7982	Westwater, Inc.  (Westwater Country Hams)	Warsaw	NC	-78.045	34.986
M7991	Nestle Prepared Foods Company	Gaffney	SC	-81.685	35.053
M7995	Empire Packing Company LP	Memphis	TN	-90.111	35.097
M79C	Smithfield Packaged Meats Corp.	Wilson	NC	-77.92	35.694
M8	Iowa Premium, LLC	Tama	IA	-92.549	41.958
M8001	Lewis Sausage Co., Inc.	Burgaw	NC	-77.932	34.564
M8002	Fishmarket Inc.	Louisville	KY	-85.775	38.25
M8005	Bloemer Food Sales Co.	Louisville	KY	-85.764	38.242
M801	Carbon County Meats, LLC	Bridger	MT	-108.919	45.279
M8013	University of Kentucky - Animal Science Meat Laboratory	Lexington	KY	-84.509	38.028
M8016	Keith Valley Packing Company - A Division of Ben E. Keith	Elba	AL	-86.088	31.394
M802	Miller Packing Company	Lodi	CA	-121.253	38.125
M8025	Roger Wood Foods	Savannah	GA	-81.148	32.09
M8028	Smithfield Packaged Meats Corp.	Middlesboro	KY	-83.718	36.599
M8030	Jim David Farm Fresh Meats	Uniontown	KY	-87.901	37.746
M8030A	Mid-South Sales, LLC	Uniontown	KY	-87.903	37.745
M8030B	Little Kentucky Smokehouse	Uniontown	KY	-87.903	37.744
M8038	Bill Newsome Hams	Princeton	KY	-87.871	37.106
M8038A	Bill Newsome Hams	Princeton	KY	-87.881	37.108
M8055	Hughes Market & Meat Processing Inc.	West Paducah	KY	-88.765	37.103
M8066	James Meat Co, Inc	Cookeville	TN	-85.6	36.193
M8066A	James Meat Company Inc	Baxter	TN	-85.601	36.169
M8069	Royal Foods Co. Inc.	Pell City	AL	-86.277	33.571
M8077	Gourmet Salads & Pickles	Pompano Beach	FL	-80.141	26.228
M8078	Boone's Abattoir, Inc.	Bardstown	KY	-85.46	37.81
M8080	The Hillshire Brands Company	Newbern	TN	-89.271	36.141
M8081	Clem's Custom Cut Meats	Lexington	KY	-84.511	38.036
M8082	Kirby & Poe Slaughterhouse	Alvaton	KY	-86.339	36.839
M8083	Palmer Farms Meats	Benton	KY	-88.348	36.865
M8091	Magnolia Provision Co., Inc.	Knoxville	TN	-83.933	36.016
M8099	Four Star Meat Product Co., Inc.	Forest Park	GA	-84.386	33.598
M810	Pilgrim's Pride Corporation	Moorefield	WV	-78.971	39.059
M8112	Grand Peaks Prime Meats	Idaho Falls	ID	-112.044	43.48
M8118	Wasatch Meats, Inc.	Salt Lake City	UT	-111.896	40.749
M8119	Producers Meat & Provision	San Diego	CA	-116.977	32.565
M8120	Wood's Meat Processing, Inc.	Sandpoint	ID	-116.541	48.382
M8124	Steamboat Meat & Seafood Co.	Steamboat Springs	CO	-106.838	40.487
M8126	Old Style Sausage	Louisville	CO	-105.129	39.982
M812A	Sioux Preme Packing Co.	Sioux City	IA	-96.372	42.398
M8131	Blue Ribbon Processing, LLC	Fowler	CO	-104.021	38.131
M8132	Katadyn North America Foods, LLC.	Rocklin	CA	-121.305	38.822
M8139	Red Bird Farms Dist. Co.	Englewood	CO	-105.008	39.671
M816	Kettle Range Meat Co. LLC	Milwaukee	WI	-87.982	43.044
M8174	Anderson Produce	Roseville	MN	-93.197	45.013
M818	HK Cooperative, Inc.	Sandusky	OH	-82.758	41.4
M8180	US Foods, Inc. d/b/a Stock Yards Meat Packing Company	South Saint Paul	MN	-93.031	44.893
M8183	L.S. Reyes Products	Tumon	GU	144.815	13.521
M8197	Nitsche's Sausage Co., Inc.	Roseville	MI	-82.924	42.515
M81A	Bar-S Foods Company	Altus	OK	-99.293	34.635
M81B	Bar-S Foods Co.	Mt. Pleasant	IA	-91.522	40.972
M81E	Bar-S Foods Co.	Elk City	OK	-99.388	35.407
M81L	Bar-S Foods Company	Lawton	OK	-98.51	34.599
M8205	Affiliated Fresh Cuts, LLC	Amarillo	TX	-101.817	35.229
M8214	Cajun Original Foods, Inc.	New Iberia	LA	-91.872	30.038
M8219	Gold Crown Food Company of the Ozarks, Inc.	Springfield	MO	-93.253	37.208
M823	Alsager Meats	Audubon	MN	-95.981	46.862
M823B	Alsager Meats	Breckenridge	MN	-96.588	46.275
M823N	Alsager Meats	Fargo	ND	-96.882	46.841
M8256	Legacy Food Company Inc,	Rancho Cucamonga	CA	-117.572	34.097
M8262	Goulart's Sausage Co.	San Jose	CA	-121.867	37.35
M8264	Richwood Meat Co.	Merced	CA	-120.52	37.328
M8271	Panizzera Meat Co.	Occidental	CA	-122.948	38.41
M8272	Roberts Corned Meats, Inc	San Francisco	CA	-122.408	37.772
M8274	Pacific Seafood - Sacramento, LLC	Sacramento	CA	-121.495	38.643
M8275	Settlers Jerky Inc.	Walnut	CA	-117.859	34.012
M8276	Innovative Solutions, Inc	Kent	WA	-122.25	47.408
M828	Lower Foods Inc.	Richmond	UT	-111.815	41.909
M8280	J&R Meat Company	Porterville	CA	-119.04	36.065
M829	Juniper Creek Farms, LLC	Poplarville	MS	-89.353	30.812
M8302	Lucky Pig Processing, LLC D/B/A Curtis Packing Company	Tifton	GA	-83.504	31.443
M8305	Larry's Sausage Co., Inc.	Fayetteville	NC	-78.849	35.061
M8314	Swaggerty Sausage Company, Inc.	Kodak	TN	-83.592	35.956
M8327	Southeastern Provision, LLC	Bean Station	TN	-83.396	36.288
M8328	Halperns' Steak and Seafood	Fort Lauderdale	FL	-80.166	26.152
M833	Prasek's Hillje Smokehouse Inc.	El Campo	TX	-96.333	29.157
M8332A	Better For Butchery, Inc.	Princeton	KY	-87.869	37.103
M8333	Sir Pizza of Tennessee, Inc	Murfreesboro	TN	-86.404	35.836
M8334	Vanguard Culinary Group, Ltd.	Fayetteville	NC	-78.895	35.038
M8337	Catalina Finer Food, LLC	Tampa	FL	-82.518	27.987
M833J	Prasek's Hillje Smokehouse	El Campo	TX	-96.334	29.158
M834	Red Field Ranch	Katy	TX	-95.811	29.785
M8347	Chicharrones Pacheco	Bayamon	PR	-66.142	18.385
M8364	Farmers Produce	Chambersburg	PA	-77.708	39.943
M8378	Rachel's Table	Greenville	RI	-71.538	41.864
M8378A	Rachel's Table, LLC	Smithfield	RI	-71.552	41.917
M838	KW Properties LLC	Creighton	NE	-97.902	42.467
M8388	Imler's Poultry Inc.	Duncansville	PA	-78.436	40.44
M8389	Pasqualichio Brothers, Inc.	Jessup	PA	-75.547	41.465
M8403	Preston St. Poultry	Louisville	KY	-85.748	38.239
M8404	Stripling's General Store Inc.	Moultrie	GA	-83.806	31.162
M8406	Mennella'a Poultry	Paterson	NJ	-74.157	40.896
M8408	Jo Mar  Provisions Inc.	Pittsburgh	PA	-79.986	40.451
M8419	DAIRY MAID RAVIOLI MFG. CORP.	BROOKLYN	NY	-73.976	40.597
M8426	Tower Isles Frozen Foods, Ltd.	BROOKLYN	NY	-73.914	40.677
M8427	Hummel Brothers, Inc.	New Haven	CT	-72.924	41.296
M8428	City Beef Company Inc	Trenton	NJ	-74.767	40.225
M8429	Aldon Food Corporation	Schwenksville	PA	-75.414	40.242
M844	ELP Franklin Foods Inc	El Paso	TX	-106.392	31.818
M8452	American Food Systems, Inc.	Burlington	MA	-71.223	42.498
M8461	M & G Meats	Westminster	MD	-76.985	39.518
M8465	Berger Wholesale Meat Co.	Huntington	NY	-73.428	40.87
M8466	Catelli Brothers	Sutton	MA	-71.731	42.18
M8489	Baretta Provision, Inc.	East Berlin	CT	-72.717	41.623
M8496	Central Meat Packing	Chesapeake	VA	-76.205	36.756
M8498	Brenneman's Meat Market Inc	Huntingdon	PA	-78.028	40.488
M8507	IRP Meat & Seafood, CO	Telford	PA	-75.324	40.335
M851	Patla Enterprises, Inc.	Rome	NY	-75.59	43.21
M8514	Miller Foods, Inc	Avon	CT	-72.861	41.801
M8526	Kite's Hams, Inc.	Wolftown	VA	-78.346	38.356
M8536	Century Frozen Foods, LLC	Carolina	PR	-65.986	18.43
M8540	Weiss Brothers Inc.	Pittsburgh	PA	-79.973	40.331
M8542	Fisher's Meats Lewisburg, LLC	Lewisburg	PA	-76.886	40.966
M8543	Troutmans Meats and Supplies	Middleburg	PA	-77.048	40.792
M8544	Chinese Spaghetti Factory	Boston	MA	-71.067	42.329
M8554	Eatem Corporation	Vineland	NJ	-75.056	39.537
M8556A	PEN LLC	New Holland	PA	-76.089	40.093
M8559	Wright's Packing Co.	Fombell	PA	-80.184	40.845
M856	Bud Antle	Bessemer City	NC	-81.255	35.281
M8560	Juniata Packing Co. / CCK Inc.	Tyrone	PA	-78.256	40.661
M8560A	Juniata Packing Co. / CCK, Inc.	Tyrone	PA	-78.255	40.663
M8562	Godfrey Bros. Meats, Inc.	York	PA	-76.705	39.867
M8565	Locker Plant LLC	Everett	PA	-78.365	40.01
M8566	Hazle Park Packing Co.	West Hazleton	PA	-75.999	40.964
M8570	Ragozzino Foods, Inc	Meriden	CT	-72.812	41.543
M8570A	Ragozzino Foods, Inc.	Meriden	CT	-72.815	41.541
M8575	Pellegrino Food Products Co., Inc.	Warren	PA	-79.138	41.854
M8596	Sechrist Bros., Inc.	Dallastown	PA	-76.644	39.901
M85B	Swift Pork Company	Beardstown	IL	-90.405	39.994
M85M	Cargill Meat Solutions Corporation	Marshall	MO	-93.247	39.118
M85O	Swift Pork Company	Ottumwa	IA	-92.394	41.004
M860	Chug Spring Butchery LLC	Chugwater	WY	-104.834	41.731
M8601	Spring Glen Fresh Foods, Inc.	Ephrata	PA	-76.139	40.175
M8603	Attilio Esposito Inc.	Philadelphia	PA	-75.158	39.937
M8609	Wilmington Slaughter	New Wilmington	PA	-80.323	41.124
M8615	Hi-Way Meat Market	Womelsdorf	PA	-76.225	40.38
M862	Double S Meats	Tonasket	WA	-119.448	48.697
M8630	Benner's Butcher Shoppe, LLC	Thompsontown	PA	-77.226	40.567
M8633	Ted's Meat Market	Reynoldsville	PA	-78.863	41.105
M8638	Specialty Steak Service	Erie	PA	-80.042	42.139
M8642	Economy Locker, LLC	Muncy	PA	-76.792	41.248
M866	CTI Foods LLC	Wilder	ID	-116.913	43.696
M8665	Rebhan R&W Meat Co. Inc.	St. Louis	MO	-90.218	38.59
M8681	Dan's Country Meats	New Melle	MO	-90.879	38.711
M8687	Bonne Terre Meat Company	Bonne Terre	MO	-90.534	37.92
M8689	House Of Sausage	Kansas City	KS	-94.624	39.111
M8696	Jennings Premium Meats, Inc.	New Franklin	MO	-92.736	39.017
M8699	Wright City Meat	Wright City	MO	-91.0	38.826
M86A	Cargill Meat Solutions	West Columbia	SC	-81.091	33.937
M86C	Cargill Meat Solutions	Columbus	NE	-97.308	41.435
M86E	Cargill Meat Solutions Corporation	Friona	TX	-102.772	34.6
M86F	Cargill Meat Solutions	Fort Worth	TX	-97.333	32.774
M86G	Cargill Meat Solutions Corporation	Newnan	GA	-84.75	33.411
M86J	Cargill Meat Solutions	Nebraska City	NE	-95.881	40.666
M86K	Cargill Meat Solutions	Dodge City	KS	-99.956	37.736
M86M	Cargill Meat Solutions Corporation	Schuyler	NE	-97.098	41.451
M86P	Cargill Beef	Hazleton	PA	-76.1	40.913
M86R	Cargill Meat Solutions	Fort Morgan	CO	-103.775	40.247
M86X	Cargill Meat Solutions, Corp.	Wichita	KS	-97.341	37.689
M87	Aunt Kitty's Foods Inc	Vineland	NJ	-75.064	39.492
M8701	John Graves Food Service	Chillicothe	MO	-93.543	39.78
M8709	Kern Meat Co. Inc.	Bridgeton	MO	-90.449	38.778
M871	Marquez Brothers International, Inc.	Montebello	CA	-118.117	34.007
M8711	Matador Foods, LLC	Blanchard	OK	-97.652	35.154
M8713	G&W Meat & Bavarian Style Sausage	St. Louis	MO	-90.269	38.598
M8721	International Dehydrated Foods, Inc.	Monett	MO	-93.902	36.917
M8721B	International Dehydrated Foods, LLC Innovation Center	Monett	MO	-93.902	36.917
M8725	Golden City Meats, L.L.C.	Golden City	MO	-94.096	37.397
M8727	Butterball, LLC	Carthage	MO	-94.311	37.183
M8728A	Jack Stack World Class LLC	Alma	MO	-93.545	39.095
M873	Tasty Jerky Hawaii, LLC	Mililani	HI	-158.016	21.459
M8732	Lucia's Pizza Manufacturing, LLC	St Louis	MO	-90.411	38.513
M874	Utah State University Meat Science Lab	Wellsville	UT	-111.889	41.669
M8745	College of the Ozarks Processing Plant	Point Lookout	MO	-93.236	36.621
M8746	Manda Packing Company	Baton Rouge	LA	-91.181	30.468
M874A	USU Meat Laboratory	Logan	UT	-111.804	41.745
M875	Gourmet Republic	Sun Valley	CA	-118.374	34.229
M8750	Imo Meat & Sausage Co.	St. Louis	MO	-90.27	38.616
M8756	DeYulio Sausage Company LLC	Bridgeport	CT	-73.212	41.169
M8757	HVFG, LLC	Mongaup Valley	NY	-74.796	41.696
M8758	Napoli Meat & Sausage Company Co., Inc.	New Haven	CT	-72.921	41.293
M8768	Kerr's Custom Butchering	South Dayton	NY	-79.071	42.439
M8771	Wohrle's Inc.	Pittsfield	MA	-73.207	42.455
M8772	Theriault's Abattoir, Inc.	Hamlin	ME	-67.906	47.135
M8776	CL Saigon Food Company	Philadelphia	PA	-75.147	39.933
M8777	London Manhattan Corp.	Bronx	NY	-73.872	40.807
M878	Dimension Marketing and Sales, Inc.	Sandy	UT	-111.903	40.581
M8782	Berks Packing Co., Inc.	Reading	PA	-75.932	40.327
M8784	National Packing Corp.	Bronx	NY	-73.892	40.811
M8784A	National Packing FL Inc.	Miami	FL	-80.35	25.793
M8795	VSC Holdings, LLC	Hinesburg	VT	-73.113	44.331
M880	Glazier Packing Company Inc.	Potsdam	NY	-75.051	44.648
M8804	ALFREDO AIELLO ITALIAN FOODS, INC.	QUINCY	MA	-71.003	42.242
M8805	Wicks Kitchens	Trainer	PA	-75.396	39.827
M881	Wells, Jenkins & Wells	Forest City	NC	-81.836	35.302
M8813	Golden Platter Foods Inc.	Newark	NJ	-74.169	40.717
M8815N	Sustainable Beef LLC	North Platte	NE	-100.724	41.118
M882	Nourish Kitchen LLC	Tempe	AZ	-111.965	33.429
M8821	Weis Market's Inc	Sunbury	PA	-76.799	40.855
M8827	WILLOW TREE POULTRY FARM, INC.	Attleboro	MA	-71.316	41.91
M8829	Edelweiss Meat Company, LLC	Albany	NY	-73.783	42.691
M883	Sweet Supplies LLC	Moxee	WA	-120.384	46.555
M8836	International Flavors & Fragrances Inc.	Dayton	NJ	-74.478	40.365
M8839	Warwick Poultry Co., Inc.	Providence	RI	-71.425	41.832
M8844A	3282 Beaver Meadow Road LLC	Sharon	VT	-72.385	43.771
M8848	Better Baked Foods, LLC	North East	PA	-79.83	42.212
M8848A	Better Baked Foods, LLC	Erie	PA	-80.021	42.121
M8850	Henry Kohn Inc. t/a Burlington Beef	Monroeville	NJ	-75.199	39.62
M8854	Marathon Enterprises Inc.	Bronx	NY	-73.91	40.804
M8855	Wilson Beef Farms LLC	Canaseraga	NY	-77.754	42.464
M886	Dubach Deer Factory & Smokehouse, LLC	Dubach	LA	-92.654	32.742
M8868	Montshire Packing, LLC	North Haverhill	NH	-72.01	44.084
M8871	Crafted Meats, LLC	Mt Royal	NJ	-75.213	39.809
M8876	NAT KAGAN MEAT & POULTRY, INC.	WOODRIDGE	NY	-74.572	41.71
M888	The Pork Rind Factory	Spartanburg	SC	-81.863	34.922
M8885	Hanover Foods Corp.	Clayton	DE	-75.642	39.287
M8888	John F. Martin & Sons LLC	Stevens	PA	-76.205	40.247
M8888A	John F. Martin & Sons Inc.	Womelsdorf	PA	-76.185	40.37
M8889	Borenstein Caterers Inc.	Jamaica	NY	-73.766	40.656
M8892	Haass' Family Butcher Shop, Inc.	Dover	DE	-75.581	39.142
M8899	George L. Wells Meat Company	Philadelphia	PA	-75.135	39.965
M889A	J.F. O'Neill Packing Co. Inc.	Omaha	NE	-95.959	41.219
M89	The Hillshire Brands Company	Kansas City	KS	-94.684	39.096
M8912	New Horizons Food Solutions, LLC.	Columbus	OH	-82.92	40.017
M8915	McDonald's Meats, Inc.	Clear Lake	MN	-93.999	45.445
M8916	St. Joseph Meat Market	St Joseph	MN	-94.32	45.565
M8918	Northland Frozen Pizza, Inc.	Brainerd	MN	-94.196	46.325
M8924	Vollwerth & Co.	Hancock	MI	-88.581	47.126
M8926	Nueske Applewood Smoked Meats	Wittenberg	WI	-89.152	44.827
M8934	Swift Pork Company	Pipestone	MN	-96.287	43.986
M8935	RF Acquisition Corp.	Wapakoneta	OH	-84.166	40.554
M8938	Pep's Pizza Company LLC	Green Bay	WI	-87.931	44.484
M8947	Randy's Foods, LLC	Faribault	MN	-93.297	44.296
M8948	Carlson Meat Shop	Grove City	MN	-94.681	45.152
M8951	Quality Meats and Culinary Specialties	Detroit	MI	-83.118	42.316
M8959	Dombrovski Meats Co. Inc.	Foley	MN	-93.911	45.665
M8979	New Geneva Meats & Processing Inc.	Geneva	MN	-93.267	43.824
M8983	Sysco Western Minnesota, Inc.	St Cloud	MN	-94.144	45.572
M8984	Provimi Foods, Inc.	Seymour	WI	-88.284	44.563
M8984A	Provimi Foods, Inc.	Seymour	WI	-88.315	44.515
M8993	Amylu Foods, LLC	Chicago	IL	-87.659	41.814
M8997	Fraboni Sausage	Hibbing	MN	-92.926	47.437
M8999	Branding Iron Holdings	Rochester	MN	-92.49	44.034
M89A	The Hillshire Brands Company	Alexandria	KY	-84.383	38.91
M9004	California State University, Chico - Meat Lab 9004	Chico	CA	-121.824	39.688
M9006	Value Meats	Vernon	CA	-118.216	33.999
M9007	Badalamente Sausage Co.	San Jose	CA	-121.886	37.316
M9008	Johansen's Quality Meats	Orland	CA	-122.139	39.752
M901	Brother's Halal Meat Packing	Stamford	NY	-74.633	42.402
M9014	Galant Food Co	San Leandro	CA	-122.148	37.705
M9018	Nestle Prepared Foods Company	Springville	UT	-111.607	40.167
M9026	Corfini Meat and Seafood	West Sacramento	CA	-121.58	38.563
M9027	NEW YORK STYLE SAUSAGE CO.	SUNNYVALE	CA	-121.988	37.404
M9034	Wei-Chuan USA, Inc.	Bell Gardens	CA	-118.149	33.971
M904	Dietz & Watson, Inc.	Baltimore	MD	-76.657	39.326
M9041	Sturgis Meats LLC	Sturgis	SD	-103.528	44.418
M9057	Kershenstine's Beef Jerky, Inc.	Eupora	MS	-89.286	33.532
M9059	Starnes Wholesale LLC	Paducah	KY	-88.617	37.054
M9062	Walker Foods, Inc.	Carrollton	GA	-85.058	33.549
M9064	Nashville Restaurant Supply	Pleasant View	TN	-87.032	36.395
M9065	Wampler's Farm Sausage Company, Inc.	Lenoir City	TN	-84.322	35.835
M907	Meritage Soups, LLC	Redmond	WA	-122.096	47.667
M9070	Kraft Heinz Foods Company	Newberry	SC	-81.63	34.304
M9085	SAN Meat Packing Inc.	Afton	TN	-82.724	36.193
M909	Pizza John's Wholesale LLC	Essex	MD	-76.447	39.312
M9091	Tom King & Son Packing Company	Summit	MS	-90.509	31.266
M9101	Chirpy's Barbecue, LLC	Bennett	NC	-79.496	35.525
M9112	Hometown Butcher	Columbia	KY	-85.301	37.064
M9120	Homestead Knoxville, LLC	Knoxville	TN	-83.912	35.973
M9122	Prime Food Inc.	Cartersville	GA	-84.833	34.2
M9127	Smoky Mountain Country Hams	Madisonville	TN	-84.298	35.561
M913	Mello's North End Manufacturers	Fall River	MA	-71.152	41.718
M9132	Conagra Brands	Jackson	TN	-88.777	35.635
M9133	Circle R Beef Inc.	Orlando	FL	-81.3	28.576
M9136	House of Raeford Farms, Inc.	Nesmith	SC	-79.574	33.722
M914	Castle Canning, LLC	Sharon	PA	-80.508	41.24
M9141	Koch Foods of Mississippi	Forest	MS	-89.474	32.352
M9145H	Flanders Provision	Hastings	NE	-98.407	40.569
M916	Halsted Street Market, Inc.	Chicago	IL	-87.646	41.825
M9165	Gold Creek Foods LLC	Gainesville	GA	-83.859	34.267
M9167A	Golden State Foods LLC	Opelika	AL	-85.309	32.712
M9168	Central Snacks, Inc.	Carthage	MS	-89.536	32.759
M9179	Uncle John's Pride LLC	Tampa	FL	-82.33	27.953
M9185	Sunset Farm Foods, Inc.	Valdosta	GA	-83.275	30.815
M919	Hafiz Brothers Inc	Houston	TX	-95.498	29.944
M9196	Walker Meats, Inc.	Carrollton	GA	-85.136	33.549
M9199	SCR International Corp.	Fairmont	NC	-79.112	34.426
M92	Fresh Mark Canton	Canton	OH	-81.331	40.814
M9200	Chalet Market Inc.	Belgrade	MT	-111.184	45.764
M9201	Hill Meat Company	Pendleton	OR	-118.848	45.686
M9202	Columbia Empire Meat Co., Inc.	Portland	OR	-122.653	45.495
M921	Paradise Market	Medina	MN	-93.545	45.044
M9211	T&T Foods, Inc.	Vernon	CA	-118.214	33.998
M9221	Childers Meat Company	Eugene	OR	-123.187	44.113
M9223	Clark Meat Science Laboratory	Corvallis	OR	-123.287	44.566
M9228	Carlton Packing Company	Carlton	OR	-123.204	45.292
M923	Glutenlibre	Carlstadt	NJ	-74.08	40.831
M9237	Reed and Hertig Packing Co	Warrenton	OR	-123.918	46.092
M9246	Crystal Creek Meats	Roseburg	OR	-123.274	43.217
M924A	Cargill Meat Solutions Corporation	Butler	WI	-88.074	43.102
M9251	Family Loompya Corporation	National City	CA	-117.105	32.659
M9252	Bright Oak Meats, Inc.	Springfield	OR	-122.913	44.142
M926	American Soy Products, Inc.	Saline	MI	-83.763	42.188
M9264	Malco's Buxton Meat Co	Sandy	OR	-122.281	45.43
M9265	Marks Meat Inc.	Canby	OR	-122.656	45.244
M9267B	BrucePac	Woodburn	OR	-122.843	45.133
M9268	Tyson Fresh Meats, Inc.	Wallula	WA	-118.916	46.139
M9270	Mt. Angel Meat Co.	Mount Angel	OR	-122.792	45.09
M9271	Jacobellis Meat & Sausage	Burbank	CA	-118.309	34.175
M928	Stone Mountain Meats	Greeneville	TN	-82.797	36.343
M9287	Ovid Meat Co., LLC	Ovid	CO	-102.388	40.959
M9288	Gaylord's Meats Co.	Fullerton	CA	-117.911	33.865
M9289	Oregon Beef Co.	Madras	OR	-121.131	44.611
M929	BMBR LLC DBA Millie Rays	Birmingham	AL	-86.84	33.458
M9295	Tillamook Country Smoker, LLC	Bay City	OR	-123.883	45.517
M9295A	Tillamook Country Smoker, LLC	Tillamook	OR	-123.849	45.458
M9295B	Tillamook Country Smoker	Beaverton	OR	-122.787	45.467
M9301	Jake's Food Service LLC	Vancouver	WA	-122.636	45.655
M9305	Ray's Wholesale Meats, Inc.	Union Gap	WA	-120.509	46.566
M9307	Royal Meat LLC	Everett	WA	-122.215	47.946
M9311	Better Meat Inc.	Seattle	WA	-122.361	47.688
M9314	Claus Meats, Inc.	Bellingham	WA	-122.475	48.761
M932	West Georgia Processing	Carrollton	GA	-85.14	33.656
M9322	Washington State University	Pullman	WA	-117.139	46.731
M9324	El Grande Chicharron	Madera	CA	-120.054	36.961
M9325	ZYK Enterprises, Inc.	Duvall	WA	-121.982	47.756
M9344	Los Hernandez Tamales LLC	Moxee	WA	-120.393	46.561
M9357	Mamula Meat Packing Co.	Aliquippa	PA	-80.287	40.637
M936	Hometown Meat Market LLC	Luling	TX	-97.657	29.729
M9364	Schiff's Food Service, Inc.	Easton	PA	-75.202	40.68
M9366	McDonald Meats Inc.	Girard	PA	-80.348	41.993
M9368	Jallaq Meats, LLC	West Middlesex	PA	-80.422	41.184
M9369	Froehlich Packing Company	Johnstown	PA	-78.945	40.339
M9370	Smith Provision Company, Inc.	Erie	PA	-80.118	42.102
M9373	Peachey Foods & Locker, LLC	Belleville	PA	-77.723	40.604
M9379A	K. Heeps, Inc.	Allentown	PA	-75.574	40.593
M9380	Bierly's Meat Market	Spring Mills	PA	-77.575	40.852
M9381	Stephen G. Manieri Meats	Bechtelsville	PA	-75.635	40.382
M9385	Green Valley Packing Co Inc	Claysville	PA	-80.356	40.147
M9387	FED-RICK VEAL CO.	PROVIDENCE	RI	-71.428	41.821
M938A	Tj's Pizza Company	St. Louis	MO	-90.197	38.754
M939	Arlindo Catering Inc.	Newark	NJ	-74.165	40.717
M9398A	Dixon Meats	Shelocta	PA	-79.33	40.614
M940	South Forty Meat Market	Lucan	MN	-95.411	44.41
M9400	Cargill Meat Solutions Corporation	Wyalusing	PA	-76.25	41.683
M9403	Gillo Brothers	Clymer	PA	-78.94	40.642
M9410	Cunningham Meats LLC	Indiana	PA	-79.25	40.632
M9423	Steely Meats	Fayetteville	PA	-77.559	39.915
M9428	East Conway Beef and Pork Processing	East Conway	NH	-70.999	44.034
M9432	US Foods, DBA Stock Yards Meat Packing Co.	Greensburg	PA	-79.567	40.29
M9434	European American Sausage Corp.	Philadelphia	PA	-75.14	39.971
M9442	Groff Meats Inc.	Elizabethtown	PA	-76.606	40.152
M9447	RI Provision Co.	Johnston	RI	-71.473	41.831
M9457	MRG Food LLC	McKeesport	PA	-79.879	40.344
M9465	Herfurth Brothers Inc	Gilbert	PA	-75.441	40.915
M947	2 Creek Butchery, LLC	Monett	MO	-93.992	36.879
M9475	William Fred Miller/Miller Distributing Inc.	St. Clair	PA	-76.187	40.718
M9476	Fox Country Smoke House LLC	Canterbury	NH	-71.52	43.382
M948	Whip City Jerky, LLC	Westfield	MA	-72.746	42.126
M9482	Espey's Meat Market	Scottdale	PA	-79.644	40.127
M948A	Jeff The Butcher Company	Westfield	MA	-72.747	42.126
M9491	Silver Star Meats, Inc.	Coraopolis	PA	-80.215	40.453
M9492	Bucher Meats	Biglerville	PA	-77.327	39.86
M9495	TASTE-RITE CO. INC.	PEACE DALE	RI	-71.499	41.451
M950	Texas Best Protein	Santo	TX	-98.112	32.614
M9503	Rocca's Italian Foods	New Castle	PA	-80.345	40.994
M9505	B & M Provisions Co.	Allentown	PA	-75.447	40.625
M9515	Elk Provision Co., Inc.	Buffalo	NY	-78.829	42.876
M952	BEF Foods, Inc.	Hillsdale	MI	-84.616	41.922
M9520	Leidy's, LLC	Souderton	PA	-75.32	40.3
M9532	Graziano Gourmet Foods	Providence	RI	-71.421	41.858
M9538	Ken Weaver Meats, Inc.	Wellsville	PA	-76.944	40.053
M954	Buona Vita Inc.	Bridgeton	NJ	-75.212	39.412
M9542	Lemay and Sons Beef, LLC	Goffstown	NH	-71.521	42.992
M9548	Wayne Nell & Sons Meats Inc.	East Berlin	PA	-76.97	39.949
M9552A	Murazzi Provision Co Inc	Kingston	PA	-75.884	41.279
M9553	Godshall's Quality Meats Inc.	Telford	PA	-75.385	40.298
M9558	Vermont Livestock Slaughter & Processing Co. LLC	Ferrisburg	VT	-73.252	44.206
M9573	JRD Meats, LLC	Claysburg	PA	-78.52	40.316
M9574	Dietz and Watson Inc.	Philadelphia	PA	-75.057	40.01
M9581	Livingston's Packing Co.	Jamestown	PA	-80.424	41.564
M9587	Exceptional Foods Inc	Pennsauken TWP	NJ	-75.027	39.976
M959	Peninsula Foodservice	Orlando	FL	-81.429	28.509
M9590	George Farms	Danville	PA	-76.741	40.976
M9591	Astra Foods, Inc.	Upper Darby	PA	-75.251	39.963
M9591A	Astra Foods, Inc.	Aston	PA	-75.408	39.849
M96	Florida Beef, Inc.	Center Hill	FL	-82.009	28.649
M960	Greater Omaha Packing Co., Inc.	Omaha	NE	-95.959	41.211
M9602	Shields Meats & Produce, Inc.	Kennebunk	ME	-70.557	43.366
M960A	Greater Omaha Packing Co., Inc.	Omaha	NE	-95.959	41.211
M9617	Henry Grasso Co., Inc.	Pittsburgh	PA	-79.911	40.467
M962	Ren Seafoods Inc	Mobile	AL	-88.122	30.714
M9627	Weiss Provision Company	Pittsburgh	PA	-79.975	40.458
M9640	Olde Tyme Meats, LLC	Chambersburg	PA	-77.679	39.962
M9646	Stoney Point Butchery, Inc.	Littlestown	PA	-77.11	39.734
M965	Interstate Meat Dist., Inc.	Clackamas	OR	-122.565	45.405
M965A	Interstate Meat Dist., Inc.	Clackamas	OR	-122.556	45.411
M965B	Interstate Meat Dist., Inc	Clackamas	OR	-122.561	45.405
M966	University of Arizona Food Products & Safety Lab	Tucson	AZ	-110.944	32.283
M9662	E. W. Mailhot Sausage Co.	Lewiston	ME	-70.207	44.092
M9672	Al-Marwa L. L. C.	Quakertown	PA	-75.345	40.473
M9675	Panhandle Food Sales Inc.	Slovan	PA	-80.389	40.364
M9681	Clair D Thompson & Son's Inc	Jersey Shore	PA	-77.259	41.203
M9684	KFS LFG, LLC	Millerton	PA	-77.016	41.943
M9687	Bixler Country Meats, Inc.	Hegins	PA	-76.583	40.649
M9688	Wehry's TT&A Quality Meats	Klingerstown	PA	-76.698	40.665
M969	Swift Beef Company	Greeley	CO	-104.691	40.444
M9691	Ricci's Italian Sausage, Inc.	McKees Rocks	PA	-80.097	40.474
M9693	Carl Venezia Meats	Plymouth Meeting	PA	-75.3	40.129
M9696	Bingman's Packing	Berlin	PA	-78.959	39.917
M969G	Swift Beef Company	Grand Island	NE	-98.318	40.923
M9701	Holland Brothers Meats	Duncansville	PA	-78.436	40.404
M9704	Springfield Meat Company, Inc.	Richlandtown	PA	-75.321	40.491
M9706	Baringer Bros. Meats	Richlandtown	PA	-75.324	40.465
M9712	Coffaro's Custom Butchering, LLC	Sugar Grove	PA	-79.304	41.983
M9714	Thoma Meat Market	Saxonburg	PA	-79.833	40.75
M972	Transylvania Meat Co Inc	Skokie	IL	-87.716	42.017
M9728	Parma Sausage Products Inc	Pittsburgh	PA	-79.985	40.45
M9760	Herring Brothers, Inc.	Guilford	ME	-69.32	45.176
M9760A	Herring Brothers, Inc.	Guilford	ME	-69.321	45.177
M9764	Mr. Pastie	Pen Argyl	PA	-75.255	40.869
M9771	T.A.I.F., Inc	Folcroft	PA	-75.271	39.89
M9778	Schiff's Food Service	Taylor	PA	-75.702	41.393
M978	John Volpi & Company, Inc.	St Louis	MO	-90.273	38.621
M9783	Schiff's Restaurant Service, Inc.	Scranton	PA	-75.639	41.449
M9784	Leona Meat Plant Inc	Troy	PA	-76.738	41.797
M978C	John Volpi & Co, Inc	St. Louis	MO	-90.275	38.617
M978N	John Volpi & Company, Inc.	St. Louis	MO	-90.274	38.62
M978S	John Volpi & Company, Inc.	Union	MO	-90.961	38.42
M9791	Denver Meats Company	Denver	PA	-76.137	40.232
M9792	Stoltzfus Meats Inc.	Gordonville	PA	-76.1	40.036
M980	One90 BBQ LLC	Dallas	TX	-96.714	32.797
M9801	Frank's Pork Products	Chatham	PA	-75.821	39.854
M981	Northern Beef Products, Inc.	Greeley	CO	-104.669	40.426
M9814	Twin Pine Farm Inc.	Seven Valleys	PA	-76.776	39.876
M9815	Sandridge - PA, LLC	New Oxford	PA	-77.049	39.86
M9819	Cabin Hollow Butcher Shop, Inc	Dillsburg	PA	-77.042	40.078
M982	Hudson Valley Craft Sausage LLC	Port Chester	NY	-73.665	40.995
M9822	J. L. Miller  & Sons Inc.	York	PA	-76.745	39.92
M9823	Laudermilch Meats Inc	Annville	PA	-76.535	40.325
M9825	Sanford Butcher Shop	Sanford	ME	-70.821	43.422
M9840	Windham Butcher Shop Inc.	Windham	ME	-70.402	43.838
M9844	Penn State Meat Lab	University Park	PA	-77.854	40.813
M9849	W. A. Bean & Sons, Inc.	Bangor	ME	-68.783	44.851
M9880	Palace Meat Company Inc.	Fresno	CA	-119.841	36.712
M9882	Busseto Foods	Fresno	CA	-119.824	36.715
M9882A	Busseto Foods	Fresno	CA	-119.833	36.761
M9887	Camino Real Foods, Inc.	Vernon	CA	-118.225	34.005
M9899	Bakersfield Meat Company	Bakersfield	CA	-119.002	35.334
M990	Hawa Corp.	Colton	CA	-117.323	34.081
M9900	Lipari's Sausage Inc.	Hawthorne	NJ	-74.151	40.965
M9903	Miller's Quality Meats, LLC	Butler	PA	-79.896	40.862
M9912	Westside Distributors, LLC	Rio Grande	NJ	-74.876	39.024
M9919	Peking Food LLC	Brooklyn	NY	-73.926	40.708
M992	JoBurg Meats, LLC	Woodbridge	CT	-72.978	41.344
M993	Frankie's Sausage	Pittsburgh	PA	-79.934	40.494
M9936B	Palenque Provision Corp.	Carlstadt	NJ	-74.08	40.831
M995	Swift Pork Company	Louisville	KY	-85.728	38.255
M9952	Buitoni USA LLC	Danville	VA	-79.313	36.572
M9958	Weimer Meats	Bradenville	PA	-79.347	40.321
M9977	Tyson Foods, Inc.	New Holland	PA	-76.085	40.094
M9979	Smith Valley Meats	Rich Creek	VA	-80.822	37.391
M998	Butcher Block Meats	Dilworth	MN	-96.683	46.879
M9992	Daniele Operating, LLC - Daniele	Pascoag	RI	-71.686	41.936
P1	Tyson Foods, Inc.	Wilkesboro	NC	-81.163	36.144
P10	Gerber Products Company	Fremont	MI	-85.952	43.47
P10001	Koegel Meats, Inc.	Flint	MI	-83.747	42.974
P10002	Dearborn Sausage Company Inc	Dearborn	MI	-83.147	42.304
P10017	Bert Hazekamp & Son Inc.	Muskegon	MI	-86.149	43.18
P10026	Hillsdale County Meats	Waldron	MI	-84.426	41.706
P10031	Ada Valley Gourmet Foods	Ada	MI	-85.515	42.962
P10038	Scotts Hook & Cleaver Inc.	Scotts	MI	-85.393	42.192
P1004	Smart Food Systems, LLC	Camuy	PR	-66.883	18.468
P10047	Rainbow Packing Inc.	Escanaba	MI	-87.191	45.798
P10053	Michigan State University Dept of Animal Science	East Lansing	MI	-84.479	42.725
P10072	Kowalski Companies, Inc.	Hamtramck	MI	-83.059	42.392
P1009	Wayne Farms LLC	Danville	AR	-93.369	35.055
P10100	Albie's Food Products, LLC	Gaylord	MI	-84.693	45.011
P10105	Smith Meat Packing, Inc.	Port Huron	MI	-82.467	42.968
P10105A	Smith Meat Packing, Inc.	Port Huron	MI	-82.435	42.991
P1011	Golden Farmer Processing, LLC	Wrightsville	GA	-82.706	32.744
P10114	C. Roy, Inc.	Yale	MI	-82.789	43.122
P10116	Mello Meats Inc.	Sterling Height	MI	-83.046	42.561
P1012	Hodie Meats, INC	Alto	GA	-83.578	34.459
P10130	Kenosha Beef International, Ltd.	Columbus	OH	-83.122	39.991
P10130A	Kenosha Beef International, Ltd.	Columbus	OH	-83.122	39.994
P10139	T. Wigley, Inc.	Detroit	MI	-83.042	42.353
P10147	Countryside Quality Meats LLC	Union City	MI	-85.129	42.055
P1015	Empire Kosher Poultry, Inc.	Mifflintown	PA	-77.398	40.56
P10158	Winter Sausage Manufacturing Company Inc.	Eastpointe	MI	-82.962	42.46
P10165	Louie's Meats	Traverse City	MI	-85.624	44.716
P10176	Jones Butchering and Meat Processing, LLC	Saranac	MI	-85.233	42.979
P10195	Bernthal Packing Inc.	Frankenmuth	MI	-83.771	43.335
P10203	A&R PackingCo., Inc.	Livonia	MI	-83.381	42.38
P10219	E.W. Grobbel Sons, Inc.	Detroit	MI	-83.037	42.347
P10227	Plath's Meats Inc.	Rogers City	MI	-83.815	45.419
P10249	Zalack's Flint Provision, Inc.	Flint	MI	-83.648	43.004
P1025	5R Custom Meats	Mt. Vernon	AR	-92.092	35.226
P10251	Ernst Hotel Supply Co.	Detroit	MI	-83.04	42.349
P10256	E & H Packing Co, Inc.	Detroit	MI	-83.038	42.346
P10266	Detroit Sausage Company, Inc.	Detroit	MI	-83.035	42.35
P10270	The Meat Block, Inc.	Muskegon	MI	-86.187	43.202
P1030	Manna Asian Foods LLC	Indianapolis	IN	-86.13	39.666
P10301	Walsh Packing Company	Pigeon	MI	-83.282	43.829
P10306	Michigan Brand, Inc.	Bay City	MI	-83.88	43.576
P10306F	Michigan Brand Inc.	Frankenmuth	MI	-83.732	43.316
P10307	J.G. Food Products, Inc.	Shelby Township	MI	-82.986	42.677
P10315	Athena Foods	Southfield	MI	-83.278	42.459
P104	OSI Industries, LLC	West Chicago	IL	-88.232	41.894
P1042	Perdue Foods LLC	Petaluma	CA	-122.592	38.234
P1046	S & S Meat Co.	Kansas City	MO	-94.552	39.118
P1049	Pitman Farms Inc. (Moroni Turkey Processing)	Moroni	UT	-111.59	39.52
P1049A	Pitman Farms Inc. (Salina Processing Plant)	Salina	UT	-111.869	38.955
P104I	OSI Industries, LLC	Oakland	IA	-95.387	41.33
P104U	OSI Industries, LLC	West Jordan	UT	-112.01	40.579
P1050	Fernandez Meat Processing LLC	Calhoun	GA	-84.943	34.52
P1050C	Fernandez Meat Processing LLC	Calhoun	GA	-84.943	34.521
P1060	Carnico Foods	Litchfield	MI	-84.759	42.032
P1061	Happy Valley Processing Inc.	Dearing	GA	-82.465	33.369
P10646	Morrilton Packing Co.	Morrilton	AR	-92.712	35.172
P10647	Famous Chili, Inc.	Fort Smith	AR	-94.414	35.398
P1065	L&M Enterprises, Inc.	Saipan	MP	145.722	15.146
P10650	Key's Family Butcher Shop	Van Buren	AR	-94.336	35.479
P10669	Randall Meat Company, Inc.	Hot Springs	AR	-93.075	34.497
P107	Conagra Brands (Conagra Foods Packaged Foods LLC)	Macon	MO	-92.47	39.737
P1074	Norpaco Inc.	Middletown	CT	-72.723	41.585
P10754	Brimhall Foods Co., Inc	Bartlett	TN	-89.813	35.208
P1077	Lincoln Provision, Inc	Chicago	IL	-87.647	41.825
P10787	MARYLAND CORRECTIONAL ENTERPRISES	HAGERSTOWN	MD	-77.715	39.557
P10795	Manger Packing Corp.	Baltimore	MD	-76.659	39.285
P10801	A&W Country Meats, Inc.	Taneytown	MD	-77.174	39.659
P10804	Wagner Meats, LLC.	Mount Airy	MD	-77.149	39.382
P10808	Shuff Meat Inc.	Thurmont	MD	-77.435	39.569
P1082	Golden Boar Product Corp	Miami	FL	-80.314	25.796
P10821	Roma Gourmet Foods, LLC	Baltimore	MD	-76.53	39.287
P10822	Casa di Pasta, Inc.	Baltimore	MD	-76.603	39.287
P10828	Hillside Turkey Farm	Thurmont	MD	-77.408	39.629
P10835	Sudlersville Frozen Meat Locker	SUDLERSVILLE	MD	-75.855	39.188
P1088	Midwestern Meats	Mesa	AZ	-111.738	33.416
P1096A	VPGC,LLC	HINTON	VA	-78.977	38.468
P1098	The Beautiful Pig, Inc.	Longview	WA	-122.945	46.134
P11	The Butchery Inc.	Danvers	MA	-70.96	42.596
P1100	Illinois Tamale Company	Chicago	IL	-87.735	41.984
P11032	Northwest Premium Meats, LLC	Nampa	ID	-116.514	43.584
P11033	Wayguud Custom Meat LLC	Meridian	ID	-116.432	43.561
P11038	Ameristar Meats, Inc.	City of Spokane Valley	WA	-117.333	47.655
P1104	Romaine Empire, Inc., d/b/a Farmer's Fridge	Chicago	IL	-87.743	41.795
P11041	Saigon Gourmet LLC	San Jose	CA	-121.897	37.369
P11044	University of Idaho Meats Lab	Moscow	ID	-117.024	46.728
P11061	Meridian Meat and Sausage	Meridian	ID	-116.391	43.608
P11070	Mickelsen Pack	Blackfoot	ID	-112.375	43.182
P11077	Palama Holdings, LLC	Kapolei	HI	-158.091	21.324
P11078	Burris Logistics	Los Angeles	CA	-118.224	34.04
P1110	Sabormix LLC	Norcross	GA	-84.199	33.952
P1111	Delicious Specialty Foods Corp.	Peekskill	NY	-73.907	41.294
P1112	CG Family Foods	Agawam	MA	-72.62	42.086
P11126	Balter Meat Company	Miami	FL	-80.394	25.649
P11132	Las Americas Frozen Foods Inc	Miami	FL	-80.211	25.798
P11133	Global Distributors	Miami	FL	-80.237	25.797
P11138	US Foods, Inc.	Orlando	FL	-81.396	28.421
P11142	Food Parade	Brooksville	FL	-82.474	28.48
P11144	Pinellas Provision Corporation	St Petersburg	FL	-82.655	27.769
P11145	La Montina Inc D/B/A El Tigre	Miami	FL	-80.22	25.798
P1115	Textured Food Innovations, LLC	Carle Place	NY	-73.604	40.751
P11150	Argus Food Processing Corporation	Medley	FL	-80.35	25.869
P11154	La Autentica Foods LLC	Hialeah	FL	-80.329	25.893
P11159	Nettles Sausage Inc	Lake City	FL	-82.601	30.065
P1116	Sunny Savory	Long Island City	NY	-73.929	40.74
P11164	City Meat Company of Tampa Inc.	Tampa	FL	-82.485	28.004
P11168	Mobleys Custom Cut	McAlpin	FL	-82.886	30.121
P11169	Amaro Foods Enterprise Inc	Miami	FL	-80.228	25.797
P11179	Special America's BBQ Inc	Medley	FL	-80.385	25.872
P11181	Casa Sierra Farm	Wimauma	FL	-82.281	27.713
P112	Tyson Foods, Inc.	Green Forest	AR	-93.429	36.331
P11201	Kallis German Buthcer Shop Inc.	Port Charlotte	FL	-82.118	26.997
P11202	Los Vinaleros Catering	Hialeah	FL	-80.287	25.848
P11204	Amba Ham Company Inc.	Miami	FL	-80.19	25.837
P11205	Florida Country Inns Inc.	Hialeah	FL	-80.282	25.863
P1123	Travis Meats, Inc.	Powell	TN	-84.044	36.016
P1127A	M.G. Waldbaum Company	Lenox	IA	-94.565	40.869
P112A	Tyson Foods, Inc.	Green Forest	AR	-93.429	36.33
P1130	B & P Meats, LLC	Brookville	PA	-79.1	41.182
P1134	Yorks Butcher Shop	Barnesville	GA	-84.191	33.005
P1137	Tyson Foods, Inc.	Seguin	TX	-97.982	29.58
P1144	Cordobes Foods LLC	Longmont	CO	-105.022	40.159
P115	Conagra Brands (Conagra Foods Packaged Foods, LLC)	Russellville	AR	-93.095	35.276
P11504	T.L. Herring & Co.	Wilson	NC	-77.895	35.702
P11509	Bachoco OK Foods	Albertville	AL	-86.17	34.233
P1156	T & LT Tamales, LLC	Flora	MS	-90.311	32.543
P1161	Burger's Ozark Country Cured Hams, Inc.	California	MO	-92.569	38.588
P1163	Unibright Foods, Inc.	Bell Gardens	CA	-118.139	33.966
P1165	Food Benefit Company	Milwaukee	WI	-87.915	43.057
P1173	Big Valley Meats	Houston	MN	-91.573	43.845
P1174	RCF, LLC dba Gemstone Foods, LLC	Decatur	AL	-86.978	34.605
P1174B	Gemstone Foods	DECATUR	AL	-87.034	34.611
P118	Maid-Rite Specialty Foods, Inc	Dunmore	PA	-75.611	41.435
P1201	Pilgrim's Pride Corporation	Sanford	NC	-79.235	35.561
P1209	Whitewater Processing LLC	Harrison	OH	-84.804	39.246
P1213	Procesos Boricuas Inc.	Toa Baja	PR	-66.209	18.404
P1216	Mom's Meals	Oklahoma City	OK	-97.639	35.397
P1233	Sterling Foods	San Antonio	TX	-98.479	29.549
P1234	Mountaire Farms Inc.	Siler City	NC	-79.45	35.732
P1235	Wayne Farms LLC	Decatur	AL	-87.043	34.607
P12425	Aala Meat Market, Inc.	Honolulu	HI	-157.874	21.326
P12429	L. Kang Inc.	Honolulu	HI	-157.867	21.32
P1243	Perdue Foods, LLC.	Rockingham	NC	-79.753	34.935
P12432	Medeiros Farms, Inc.	Kalaheo	HI	-159.528	21.922
P12435	Pacific Sausages Co. Inc.	Honolulu	HI	-157.884	21.325
P12436	Wong's Meat Market Holdings, LLC	Honolulu	HI	-157.876	21.306
P12437	Amor Nino Foods, Inc.	Honolulu	HI	-157.885	21.326
P12440	Kukui Sausage	Honolulu	HI	-157.881	21.333
P12442	Hawaiian Pastele Company LLC	Honolulu	HI	-157.869	21.324
P12444	Warabeya U.S.A., Inc.	Waipahu	HI	-158.01	21.388
P12445	Kulana Foods, Ltd.	Hilo	HI	-155.084	19.684
P12446	Golden Coin Food Industries	Honolulu	HI	-157.886	21.323
P12452	Young's Meat Market	Honolulu	HI	-157.865	21.317
P12453	Lee's Chop Suey, Inc.	Hilo	HI	-155.076	19.706
P12456	PNJ Sausage Hawaii Corporation	Kaneohe	HI	-157.805	21.418
P12457	Higa Foodservice	Honolulu	HI	-157.901	21.333
P12473	Frank's Foods, Inc.	Hilo	HI	-155.1	19.68
P1249	George's Chicken, LLC	Edinburg	VA	-78.61	38.877
P1250	Fieldale Farms Corporation	Cornelia	GA	-83.537	34.507
P1254	Koch Foods of Ashland, LLC	Ashland	AL	-85.819	33.284
P1257	Fieldale Farms Corporation	Murrayville	GA	-83.901	34.411
P1259	Capitol Kitchen, LLC	Caldwell	ID	-116.633	43.659
P12603	Cameron's British Foods Inc	Cape Coral	FL	-81.953	26.698
P12604	Mulberry Farms Inc.	Gainesville	GA	-83.826	34.275
P12610	Productos El Jibarito	Morovis	PR	-66.389	18.308
P12612	Boar's Head Provisions Co., Inc.	Jarratt	VA	-77.524	36.827
P12612A	Boar's Head Provisions Co., Inc.	Petersburg	VA	-77.413	37.175
P12622	NAIVE LLC	Isabela	PR	-67.0	18.451
P12626	Hursey's BBQ Wholesale, Inc.	Elon	NC	-79.509	36.162
P12630	Polk's Meat Products, Inc.	Magee	MS	-89.757	31.874
P12641	CUSTOM FOODS OF AMERICA, INC.	Knoxville	TN	-83.972	35.977
P12649	MMI Meats LLC.	Newport News	VA	-76.431	36.986
P12650	Fieldale Farms Corporation	Gainesville	GA	-83.799	34.286
P1272	Pilgrim's Pride Corporation	Douglas	GA	-82.847	31.527
P1275	Pies & Sides	Mount Holly	NC	-81.039	35.291
P1278	Custom Culinary, Inc.	Oswego	IL	-88.311	41.716
P1284	Pilgrim's Pride Corporation	Canton	GA	-84.503	34.194
P1294	Holmes Foods Inc.	Nixon	TX	-97.769	29.266
P13	Campbell Soup Supply Company L.L.C.	Paris	TX	-95.562	33.685
P13016	City Meat Steak Co., Inc.	Houston	TX	-95.336	29.752
P13025	Quality Pork International Inc.	Omaha	NE	-96.077	41.22
P13040	Zummo Meat Co.	Beaumont	TX	-94.133	30.051
P1304A	Farmers Pride, Inc.	Fredericksburg	PA	-76.405	40.45
P1304B	Farmers Pride, Inc.	Fredericksburg	PA	-76.411	40.443
P1305	Holly Poultry, LLC	Baltimore	MD	-76.642	39.268
P13051	P.E. & F Inc. DBA DiMare's Specialty Foods	St Louis	MO	-90.286	38.613
P13054	H & B Packing Co. Inc.	Waco	TX	-97.113	31.568
P13054B	Farmer Jones Factory	Waco	TX	-97.142	31.542
P1305A	Holly Poultry, Inc.	Hanover	MD	-76.718	39.17
P13069	Benny's Pork Skins	El Paso	TX	-106.351	31.717
P1307	Mar-Jac Poultry-AL	Jasper	AL	-87.278	33.818
P13079	Rabe's Quality Meat Inc.	Omaha	NE	-96.119	41.203
P13081	Tri State Meats LLC DBA Special D Meats	Macon	MO	-92.467	39.767
P13083	Amigo's Mexican Foods, Inc	Deming	NM	-107.745	32.26
P1309	House of Raeford Farms Inc.	Greenville	SC	-82.368	34.893
P13096	Magic Seasoning Blends, Inc.	Palmetto	LA	-91.881	30.717
P13097	Del Vecchio Foods, Inc.	Houston	TX	-95.55	29.71
P13125	Reser's Fine Foods, Inc.	Topeka	KS	-95.636	39.037
P13126	Dominion Foods Group LLC	Bryan	TX	-96.342	30.673
P13127	Ditta Meat Company	Pasadena	TX	-94.991	29.6
P13128B	Diversified Foods & Seasonings, L.L.C.	Madisonville	LA	-90.187	30.462
P13130	Blount Fine Foods Corp.	McKinney	TX	-96.627	33.227
P13131	Omaha Variety Meats, LLC	Henderson	NE	-97.808	40.79
P13136	Padrino Foods LLC	Irving	TX	-96.99	32.821
P13149	Krehbiels Specialty Meats Inc	McPherson	KS	-97.624	38.409
P1315	Tyson Foods, Inc.	Monett	MO	-93.914	36.918
P13153	Fredericksburg Lockers, Inc.	Fredericksburg	TX	-98.871	30.268
P1317	Wayne Farms LLC	Albertville	AL	-86.201	34.258
P13170	Oklahoma City Meat Company	Oklahoma City	OK	-97.532	35.464
P13172	Intermex Products USA, LTD.	Grand Prairie	TX	-97.043	32.789
P13174A	Amy Food Inc.	Houston	TX	-95.239	29.671
P1318	Perdue Foods, LLC	Milford	DE	-75.421	38.923
P13181	Wald Family Foods	Omaha	NE	-96.123	41.222
P13181A	Wald Family Foods, LLC	McPherson	KS	-97.683	38.357
P13182	Lineage Logistics, LLC	Omaha	NE	-95.951	41.2
P13186	JYC Enterprise, Inc.	Houston	TX	-95.212	29.77
P13186A	JYC Foods	Houston	TX	-95.531	29.723
P1319	Chef's Fresh Foods	Mendota	CA	-120.385	36.762
P13199	Chorizo de San Manuel Inc.	Edinburg	TX	-98.121	26.559
P13201	Siegi's Sausage House, Inc.	Tulsa	OK	-95.904	36.045
P13203	Boutte's Boudin	Lumberton	TX	-94.233	30.284
P13205A	Nuevo Garcia Foods, LLC	San Antonio	TX	-98.524	29.512
P13206	Rutledge Meat Processing	Rutledge	MO	-92.088	40.314
P1321	Mrs. Ressler's Food Products Co.	Philadelphia	PA	-75.103	40.035
P13219	VAN Oriental Food, Inc.	Dallas	TX	-96.865	32.805
P13244	Crescent City Meats	Metairie	LA	-90.214	29.975
P1325	Tyson Foods, Inc.	New Holland	PA	-76.085	40.094
P13251	Big Easy Foods of Louisiana, LLC	Lake Charles	LA	-93.217	30.187
P1327	Peach State Kitchen	Stonecrest	GA	-84.118	33.721
P13274	Big A Meatball Company	Oklahoma City	OK	-97.563	35.479
P13276	Bottomland Prime, LLC	Amarillo	TX	-101.91	35.073
P1330	Leidy's, LLC	Harleysville	PA	-75.382	40.275
P13331	Tyson Processing Services, Inc	Omaha	NE	-96.116	41.203
P13335	Walker's Food Products Co.	North Kansas City	MO	-94.575	39.131
P13343	Old Santa Fe Trail, Inc.	Albuquerque	NM	-106.564	35.075
P13346	Savoie's Sausage & Food Products, Inc	Opelousas	LA	-92.0	30.534
P13369	George's Processing, Inc.	Cassville	MO	-93.92	36.744
P13375	A La Carte Foods Properties, LLC	Belle Rose	LA	-91.039	30.0
P13377	Selecto Pork Skin Company	Houston	TX	-95.296	29.737
P13387	The Original Zwolle Tamale	Zwolle	LA	-93.642	31.632
P13389	Isabella Foods, Inc.	El Paso	TX	-106.334	31.749
P134	David Elliot Poultry Farm Inc.	Scranton	PA	-75.682	41.389
P13409	O'Steen Meat Specialties, Inc.	Oklahoma City	OK	-97.513	35.491
P1341	Crave Creations LLC	Clearwater	FL	-82.701	27.897
P13415	Fremont Beef Company	Fremont	NE	-96.489	41.42
P13418	Kerry Inc	Fort Worth	TX	-97.312	32.64
P1342	Hartley Cold Services LLC	Hartley	IA	-95.476	43.179
P1343	Tata's Pierogi Factory, LLC	Franklin Park	IL	-87.855	41.933
P13430	Mountain View Meats Company, Inc.	Stilwell	OK	-94.724	35.798
P13432A	Martin Foods, L.P.	Houston	TX	-95.379	29.776
P13433	Tyson Prepared Foods, Inc.	Dallas	TX	-96.887	32.684
P13437	GOA Sausage	Mesquite	TX	-96.667	32.807
P13445	Huse's Processing Inc.	Malone	TX	-96.924	31.931
P13453	Hudson Meat Market	Austin	TX	-97.751	30.246
P13456	Tyson Foods, Inc.	Pine Bluff	AR	-92.076	34.264
P13467	Sausage Warehouse, LLC	Pittsburg	TX	-94.968	32.995
P13471	Kenrick's Meat Co.	St. Louis	MO	-90.295	38.549
P1348	Bare Naked Birdies, Inc.	Sacramento	CA	-121.506	38.566
P13484	Direct Source Meats	San Antonio	TX	-98.408	29.44
P13484A	Direct Source Meats - Cooked	San Antonio	TX	-98.407	29.439
P13486	Tippins Food Plant	Kansas City	KS	-94.695	39.094
P13487A	Chef John Folse and Company	Donaldsonville	LA	-90.962	30.078
P13492	Lovera Gro., Inc.	Krebs	OK	-95.723	34.926
P13517	Southern Wild Game Holdings LLC	Devine	TX	-98.905	29.096
P13520	Reser's Fine Foods	Topeka	KS	-95.633	39.036
P13525	Poche's	Breaux Bridge	LA	-91.904	30.313
P1353	Pilgrim's Pride Corporation	Chattanooga	TN	-85.313	35.037
P13530	Tian Tian Food Service	Houston	TX	-95.267	29.712
P13533	RCG Foods of Texas, Inc.	El Paso	TX	-106.465	31.772
P13551	Chappell Hill Sausage Company	Chappell Hill	TX	-96.199	30.13
P13553	WARABEYA North America, Inc.	Lewisville	TX	-96.982	33.026
P13556	Tyson Foods, Inc.	Sedalia	MO	-93.32	38.748
P13561	165368 C. Corporation	Houston	TX	-95.472	29.839
P13562	Schnuck Markets, Inc. SLNP	St. Louis	MO	-90.331	38.739
P13564	Rath, Inc.	Apache	OK	-98.355	34.899
P13575	Ridgeway Freezer Inc	Ridgeway	MO	-94.006	40.383
P13584	George's Further Processing	Springdale	AR	-94.135	36.17
P13590	Southwest Processor, Inc.	Stafford	TX	-95.579	29.634
P13598	Lionshare LLC	Houston	TX	-95.348	29.752
P136G	OSI Industries, LLC	Geneva	IL	-88.269	41.894
P1370	Vienna Beef Ltd.	Chicago	IL	-87.652	41.824
P138	Conagra Brands (ConAgra Foods Packaged Foods, LLC)	Fayetteville	AR	-94.178	36.05
P1380	Suzanna's Kitchen	Suwanee	GA	-84.03	34.034
P1382	Suzanna's Kitchen Inc	Norcross	GA	-84.17	33.98
P1384	Ritter Foods, LLC	Philadelphia	PA	-75.153	39.905
P1392	Dudley Poultry Company	Middlesex	NY	-77.265	42.718
P1402	Theodore L. Gross Inc.	Perkasie	PA	-75.301	40.371
P1403	Otto's Meats, LLC	Luxemburg	WI	-87.702	44.53
P1407	East Texas Beef Processors	Frankston	TX	-95.554	32.062
P1411	Fort Worth Meat Packers LLC	Arlington	TX	-97.052	32.756
P1430	Espostos Fine Foods, Inc.	South San Francisco	CA	-122.406	37.636
P1434	Clydes Sausage, Inc.	Denver	CO	-104.999	39.768
P1448	Smithfield Fresh Meats Corp.	Smithfield	VA	-76.631	36.99
P1451	Triple S Provisions	Baltimore	MD	-76.702	39.353
P1469	Morgan Foods, Inc.	Austin	IN	-85.808	38.746
P1480	Tip Top Poultry, Inc.	Marietta	GA	-84.515	33.959
P1487	Palermo Villa, Inc.	Milwaukee	WI	-87.957	43.027
P1489	Tyson Refrigerated Processed Meats, Inc.	Houston	TX	-95.279	29.784
P1494	West G Street LLC	Wilmington	CA	-118.264	33.778
P1496	Tyson Foods, Inc.	Ringgold	VA	-79.316	36.596
P1499	Pelkins Smokey Meat Market	Crivitz	WI	-87.996	45.218
P1505	The Meat Block LLC	Greenville	WI	-88.548	44.305
P1509A	Atlantic Veal & Lamb Inc	Brooklyn	NY	-73.935	40.714
P1512	Goya de Puerto Rico, Inc.	Bayamon	PR	-66.144	18.413
P1516	Morgan's Meat Market	Mattoon	IL	-88.371	39.489
P151A	John W. Williams, Inc.	Bronx	NY	-73.872	40.807
P1523	Kronos Foods Corp.	Glendale Heights	IL	-88.098	41.934
P1525	Samuel Holmes, Inc.	Everett	MA	-71.048	42.402
P1533	Nestle Culinary Innovation Center	Solon	OH	-81.465	41.402
P1539	Hickory Baked Ham Company Inc.	Castle Rock	CO	-104.871	39.409
P1540	DeBragga & Spitler, Inc.	Jersey City	NJ	-74.06	40.72
P1542	Isernio's Sausage Co.	Kent	WA	-122.231	47.398
P1543	Corfini Gourmet	Tualatin	OR	-122.791	45.376
P155	Smart Foods LLC	Cincinnati	OH	-84.459	39.262
P15503	Hemphill Souse & Sausage Inc	Jackson	MS	-90.231	32.332
P15504	Snowdens LLC	Andalusia	AL	-86.507	31.324
P1562	The Center Cut Slaughter and Meat Processing	Farmington	MO	-90.458	37.824
P157	Diestel Turkey Ranch	Turlock	CA	-120.844	37.485
P15700	Fresh Mark, Salem	Salem	OH	-80.847	40.884
P15703	Kraft Heinz Company	Massillon	OH	-81.541	40.779
P15707	Champion Pizza	Hebron	IL	-88.432	42.471
P15714	Morton Pizza Partners LLC	Morton	IL	-89.489	40.603
P15720	Winkler Meats, Inc.	Peoria	IL	-89.619	40.67
P15724	Case Farms Processing	Winesburg	OH	-81.684	40.614
P15727	Monogram Meat Snacks, LLC	Chandler	MN	-95.949	43.933
P15727A	Branding Iron Holdings	Sauk Rapids	MN	-94.145	45.589
P15731A	Square One Foods Inc.	Siren	WI	-92.396	45.783
P15735	FULTON MARKET	Chicago	IL	-87.737	41.815
P15738	Sunrise Foods, Inc.	Columbus	OH	-82.939	39.927
P15747	Liguria Foods, Inc.	Humboldt	IA	-94.23	42.738
P15754	Husnik Meat Co., Inc.	South Saint Paul	MN	-93.033	44.888
P15754A	Husnik Meat Co. Inc.	Newport	MN	-93.008	44.88
P15767	Consumers Packing Co.	Melrose Park	IL	-87.869	41.899
P15768	Miltona Custom Meats Inc.	Miltona	MN	-95.286	46.045
P15772	Sensient Flavors LLC	Harbor Beach	MI	-82.648	43.845
P158	Sailer's Food Market and Meat Processing	Elmwood	WI	-92.153	44.78
P1580	Kim's Processing Plant Inc	Clarksdale	MS	-90.571	34.202
P15802	Hiawatha Pasties	Naubinway	MI	-85.449	46.095
P15805	J&B Wholesale Distributing Inc.	St Michael	MN	-93.62	45.215
P15815	Miracapo Pizza Company LLC	Elk Grove Village	IL	-87.945	41.998
P15815A	Miracapo Pizza Company LLC	Gurnee	IL	-87.898	42.387
P15815B	Miracapo Pizza Company LLC	Elk Grove Village	IL	-87.948	41.998
P15816	Heggies Pizza, LLC	Milaca	MN	-93.645	45.767
P15818A	Kraft Heinz Foods Company	Cedar Rapids	IA	-91.635	41.932
P15820	Corfu Foods, Inc	Bensenville	IL	-87.945	41.978
P15825	AFS Classico, LLC	Rock Island	IL	-90.591	41.478
P15826	Keystone Meats Inc.	Lima	OH	-84.038	40.732
P15833	Premium Meats, Inc.	Warren	OH	-80.806	41.238
P15835	Dan's Prize, Inc.	Long Prairie	MN	-94.863	45.961
P15835A	Dan's Prize, Inc.	Browerville	MN	-94.864	46.069
P15841	DiRusso's Sausage Incorporated	Youngstown	OH	-80.668	41.109
P15845	Stiglmeier Sausage Co., Inc.	Wheeling	IL	-87.913	42.127
P15851	Contract Comestibles LLC	East Troy	WI	-88.409	42.789
P15854	John Hofmeister & Son, Inc	Chicago	IL	-87.675	41.849
P15857	Distinctive Foods, LLC	Bensenville	IL	-87.93	41.947
P1586	TMB East LLC	Kaukauna	WI	-88.284	44.244
P15869	Fred Usinger, Inc.	Milwaukee	WI	-87.914	43.043
P1587	Gev's Kitchen	Van Nuys	CA	-118.449	34.204
P15875	The Honey Baked Ham Company, LLC	Holland	OH	-83.688	41.619
P15877	Bernatello's Pizza Inc.	Waupaca	WI	-89.244	44.33
P15878	Smithfield Packaged Meats Corp.	Sioux City	IA	-96.382	42.484
P15893	AmeriQual Group, LLC	Evansville	IN	-87.552	38.143
P15893C	Arc Industries	Evansville	IN	-87.481	38.0
P15893D	AmeriQual Distribution Center	Evansville	IN	-87.527	38.026
P15894	Winesburg Meat Inc.	Winesburg	OH	-81.698	40.615
P15896	Abbyland Pork Pack, Inc.	Curtiss	WI	-90.435	44.95
P15899	Hearthside Food Solutions, LLC	Lakeville	MN	-93.222	44.633
P158A	Sailer's Food and Meat Processing	Wilson	WI	-92.199	44.923
P1591	Mudpond Farm	Dalton	PA	-75.675	41.613
P1593	Echo Lake Foods	Huntington	IN	-85.497	40.88
P1604	Pig Rock Sausages, LLC	Boston	MA	-71.066	42.329
P1605	Tide Mill Organic Farm, LLC	Edmunds Twp	ME	-67.157	44.828
P161	Brakebush Brothers, Inc.	Westfield	WI	-89.487	43.818
P161M	Brakebush Mocksville, Inc.	Mocksville	NC	-80.553	35.88
P161W	Brakebush Brothers, Inc.	Wells	MN	-93.723	43.747
P1627A	West Lake Food Corporation	Santa Ana	CA	-117.902	33.747
P1627B	Craftory	Houston	TX	-95.364	29.969
P1638	Kemin Proteins, LLC	Verona	MO	-93.795	36.97
P164	Tyson Foods, Inc.	Forest	MS	-89.493	32.36
P1641	Briardale Ostrich Farms	Okeechobee	FL	-80.98	27.41
P1642	The Meat House	Andover	SD	-97.888	45.414
P1643	WCD Kitchen - Lacey	Lacey	WA	-122.767	47.085
P1644	WCD Kitchen - Minooka	Minooka	IL	-88.303	41.444
P1645	Nathan & Sons, Inc.	South El Monte	CA	-118.035	34.048
P165	Bachoco OK Foods	Fort Smith	AR	-94.385	35.423
P1652	Gourmet Game Processing	Dilworth	MN	-96.706	46.877
P1653	Top Food Provision	Paterson	NJ	-74.149	40.893
P1655	Rashbe Holdings, Inc.	Birdsboro	PA	-75.828	40.277
P1656A	Dim Sum Factory, Inc.	Whitestone	NY	-73.813	40.789
P1657	Granite State Packing Cooperative, Ltd.	Claremont	NH	-72.372	43.372
P165H	Bachoco OK Foods	Heavener	OK	-94.601	34.909
P165M	Bachoco OK Foods	Muldrow	OK	-94.584	35.41
P165S	Bachoco OK Foods	Fort Smith	AR	-94.385	35.424
P1668	Ebro Foods, Inc	Chicago	IL	-87.658	41.817
P1672	Home Taste Food, Inc.	Norwood	MA	-71.203	42.184
P1680	IJean Food	South El Monte	CA	-118.033	34.044
P1682A	Nestle USA. INC.	Schamburg	IL	-88.063	42.073
P1684	Jenniges Meat Processing Inc	Brooten	MN	-95.132	45.502
P1687	Symba & Snap Gourmet Food, Inc.	Cleveland	OH	-81.651	41.497
P169	The Suter Company, Inc.	Sycamore	IL	-88.692	41.992
P1691	Skyline Chili LLC	Fairfield	OH	-84.483	39.328
P1693	Charcuteria Scorpion LLC	Hialeah	FL	-80.347	25.897
P1697	Edgewood Locker Inc.	Edgewood	IA	-91.41	42.645
P170	Wayne Farms LLC	Pendergrass	GA	-83.673	34.179
P17050	Russ' Commissary	Holland	MI	-86.097	42.831
P17064	Devanco Foods	Carol Stream	IL	-88.105	41.925
P17065	King Meat Service Inc.	Vernon	CA	-118.203	34.003
P17074	A. Gimenez Trading LLC	Oak Ridge	NJ	-74.528	41.052
P17077	458 1/2 South Broadway Meat Inc	Yonkers	NY	-73.896	40.918
P1708	Creation Gardens, Inc.	Austell	GA	-84.583	33.762
P17080	Spar Sausage Company	San Leandro	CA	-122.159	37.718
P17081	Newport Meat of Nevada	Las Vegas	NV	-115.189	36.091
P17086	Frontiere Natural Meats, LLC	Denver	CO	-104.976	39.788
P17095	Boesl Packing Co., Inc.	Baltimore	MD	-76.579	39.318
P1710	EmpaNet LLC	Tampa	FL	-82.464	28.025
P17104	Hermanos Dajer Inc.	Irvington	NJ	-74.245	40.72
P17124	California Correctional Training and Rehabilitation Authority (CALCTRA)	Ione	CA	-120.948	38.375
P17135	Claymont Food Co.	Claymont	DE	-75.457	39.802
P1714	Jensen Reserve	Loganville	GA	-83.818	33.869
P17143	JWM Distribution	San Bernardino	CA	-117.26	34.106
P17151	UW Provision Company, Inc.	Middleton	WI	-89.535	43.101
P17156	Ghiringhelli Brothers	Vallejo	CA	-122.241	38.097
P17161	Woolery Enterprises Inc.	San Leandro	CA	-122.173	37.704
P17179	California Correctional Training and Rehabilitation Authority	Avenal	CA	-120.124	35.972
P17183	Busseto Foods	Fresno	CA	-119.824	36.715
P171Y	Moweaqua Packing Plant	Moweaqua	IL	-89.019	39.631
P1720	Medicine Lodge Meat Company LLC	Medicine Lodge	KS	-98.589	37.284
P17202A	Americold Logistics, LLC	Sioux City	IA	-96.371	42.427
P17202B	Americold Logistics, LLC	Napoleon	OH	-84.1	41.412
P17202S	Americold Logistics LLC	Sanford	NC	-79.214	35.518
P17220	Geier's Sausage Kitchen	Sarasota	FL	-82.538	27.419
P17237	K. T.'s Kitchens, Inc.	Carson	CA	-118.256	33.876
P17256	Garden Fresh Foods, LLC	Milwaukee	WI	-87.926	43.024
P1726	Tomoe Food Services, Inc.	Bronx	NY	-73.872	40.807
P17260	International Provisions, Inc.	Hamden	CT	-72.932	41.341
P17260A	International Provisions, Inc.	Hamden	CT	-72.931	41.342
P17260B	International Provisions, Inc.	Hamden	CT	-72.932	41.342
P17264	Hearn Kirkwood / Food Unlimited	Jessup	MD	-76.765	39.166
P1727	Sierra Meat and Seafood	Reno	NV	-119.752	39.505
P17270	Sovereign Seafoods Inc	Santa Barbara	CA	-119.692	34.415
P17272	Canino's Sausage Company Co., Inc.	Denver	CO	-104.999	39.777
P1728	Daniel Jackson Meat Processing	Ranburne	AL	-85.349	33.557
P17280	JBS Prepared Foods - Swanton Facility	Swanton	VT	-73.128	44.928
P17281	Yoder Meats, Inc.	Shipshewana	IN	-85.58	41.672
P17284	Protenergy Natural Foods, Inc.	Cambridge	MD	-76.064	38.551
P1729	OH Grate!	Collierville	TN	-89.73	35.052
P17304	Island Grown Foods, Inc.	Waipahu	HI	-158.001	21.425
P17307	Logan Food Company Inc.	Alexandria	VA	-77.107	38.807
P17309	Day-Lee Foods Inc.	Santa Fe Springs	CA	-118.054	33.892
P17311	Harry's Frozen Food	Elrosa	MN	-94.949	45.562
P17318	Jane's Stromboli	Stoneboro	PA	-80.105	41.339
P1732	Lucchesi Worldwide LLC	Memphis	TN	-89.858	35.171
P17328A	Michael Angelo's Gourmet Foods Inc.	Austin	TX	-97.677	30.472
P17335	Intra Coastal Packing, Inc.	Lake Worth	FL	-80.113	26.63
P17336	ROYAL POULTRY, INC.	CRANSTON	RI	-71.471	41.788
P17338	E-HWA Food Products Co.	Huntington Park	CA	-118.224	33.994
P17339	Marketplace Deli Products Inc.	Glendale	AZ	-112.175	33.52
P17340	Pilgrim's Pride Corporation	Hickory	KY	-88.652	36.829
P17341	Keystone Foods LLC	Gadsden	AL	-86.073	33.965
P17351	Newport Meat Pacific Northwest	Portland	OR	-122.496	45.557
P17354	Central Storage & Warehouse Co	Madison	WI	-89.309	43.083
P17356	Y. H. Foods, Inc.	Skokie	IL	-87.775	42.02
P17375	E.G. Food Inc.	Brooklyn	NY	-74.022	40.647
P1738	Monogram Gourmet Foods	Haverhill	MA	-71.124	42.787
P17384	Sconnie Slices LLC	Glen Flora	WI	-90.894	45.498
P17390	Shoals Provision	Florence	AL	-87.655	34.866
P17395	50th State Poultry	Pearl City	HI	-157.956	21.392
P17399	Graciana LLC	Sylmar	CA	-118.402	34.282
P1740	Brookwood Farms	Siler City	NC	-79.448	35.72
P17410	Deutschland Foods, Inc.	Lindstrom	MN	-92.847	45.39
P17413	Ossian Packing Co. Inc.	Ossian	IN	-85.166	40.873
P17417	Ajinomoto Foods North America, Inc,	San Diego	CA	-116.962	32.553
P17419	Dewig Bros. Packing Co.	Haubstadt	IN	-87.573	38.209
P17426	Great Kitchens Food Company	Brockton	MA	-71.022	42.108
P17428	Cascioppo Meats	Kirkland	WA	-122.158	47.713
P17433	Country Meats, LLC	Ocala	FL	-82.215	29.185
P17439	American Kitchen Delights Inc.	Harvey	IL	-87.67	41.611
P1745	Maple Brook Packing	New Milford	CT	-73.421	41.592
P17453	Silver Comet Foods, LLC (FKA Tip Top Poultry Inc.) distributed by Tip Top	Rockmart	GA	-85.063	34.012
P17454	Clark's Poultry and Seafood	Hamburg	NY	-78.839	42.723
P1746	Archway Farm, LLC	Keene	NH	-72.338	42.936
P1747	Hawkeye Smokehouse Partners LLC	Burlington	IA	-91.15	40.802
P17479	Fair Oaks Foods, LLC	Pleasant Prairie	WI	-87.899	42.535
P17479T	Fair Oaks Foods, LLC	Pleasant Prairie	WI	-87.915	42.527
P1748	Stagecoach Meat Company, LLC	Wiggins	CO	-104.079	40.23
P17480	Ramar International Corporation	Pittsburg	CA	-121.887	38.014
P17480A	Ramar International Corporation	Pittsburg	CA	-121.885	38.025
P17485	Greater American Ribs Inc.	Woodbury	MN	-92.974	44.924
P17500	Pilgrim's Pride Corporation	Russellville	AL	-87.672	34.461
P1752	Idaho Meat and Seafood	Nampa	ID	-116.564	43.578
P17521	Cheney OFS, Inc.	Orlando	FL	-81.426	28.577
P17523	Ruiz Food Products, Inc.	Dinuba	CA	-119.398	36.54
P17523A	Ruiz Food Products, Inc.	Denison	TX	-96.571	33.774
P17524	Espi's Sausage and Tocino Co.	Seattle	WA	-122.339	47.575
P17526	La Favorita Food Processing	Henderson	CO	-104.904	39.866
P17530	3 Little Pigs LLC	Wilkes Barre	PA	-75.901	41.236
P17545	John's Market	Elgin	IL	-88.283	42.036
P17554	Farmingdale Meat Market, Inc., DBA Main Street Wholesale Meats	Farmingdale	NY	-73.446	40.734
P17557	JPI Wholesalers, Inc.	Hannibal	MO	-91.408	39.68
P1756	Kettle Cuisine	Savage	MD	-76.806	39.132
P17562	Mitty's LLC	Bloomfield	CT	-72.708	41.812
P17573	Bell Tasty Foods Inc	Elk Grove	CA	-121.36	38.384
P17582	A. S. K. Foods Inc.	Palmyra	PA	-76.609	40.303
P1759	Fortune Wisconsin LLC	Green Bay	WI	-88.084	44.53
P17604	Americold Logistics	Montgomery	AL	-86.362	32.315
P17610	PORTION MEAT ASSOCIATION, INC.	Providence	RI	-71.438	41.827
P1762	Pasta Il Cuoco Inc	Miami	FL	-80.253	25.772
P17620	Premiere Brand Meats	Shasta Lake	CA	-122.385	40.658
P17626B	Crystal Distribution Services, Inc.	Waterloo	IA	-92.322	42.491
P17634	M.G. Waldbaum Company	Gaylord	MN	-94.197	44.557
P17635	Emerson Distributing	Medford	OR	-122.895	42.314
P17642	Quality Snack Foods, Inc.	Alsip	IL	-87.715	41.656
P17643	Cuisine Solutions Inc.	ALEXANDRIA	VA	-77.108	38.807
P17644	Request Foods Inc.	Holland	MI	-86.102	42.832
P17644A	Request Foods Inc.	Holland	MI	-86.1	42.835
P17644B	Request Foods Inc.	Holland	MI	-86.104	42.839
P17658	Arch Foods, Inc.	Union	NJ	-74.302	40.693
P1766	Henry J's Meat Specialties	Chicago	IL	-87.739	41.917
P17669	Kerry Stock & Broth Company Inc.	Harrisonburg	VA	-78.861	38.474
P1767	Golden Meat Co., LLC	Bronx	NY	-73.872	40.807
P17691	Johnsonville, LLC	Sheboygan Falls	WI	-87.91	43.798
P17694	Drakes Fresh Pasta Company	High Point	NC	-80.034	35.924
P17696	Mt. Airy Meat Center, Inc.	Mt. Airy	NC	-80.584	36.48
P177	Pilgrim's Pride Corporation	Gainesville	GA	-83.827	34.283
P17704	Rick's Barbecue, Inc	Leoma	TN	-87.337	35.189
P17708	Logistic Services, LLC	Eldridge	IA	-90.577	41.629
P17719	Highland Packing Company, Inc.	Colona	IL	-90.357	41.471
P17728	Tyson Foods, Inc.	Vicksburg	MS	-90.66	32.366
P17734	Stonewood Farm Inc.	Orwell	VT	-73.247	43.817
P17749	Bastan Corporation	Chula Vista	CA	-117.085	32.596
P17751	Chamblee Meats & Suppy, Inc.	Chamblee	GA	-84.292	33.896
P1776	San Lorenzo Foods, LLC	Pomona	CA	-117.73	34.06
P17764	Abbyland Foods, Inc.	Abbotsford	WI	-90.311	44.942
P17764A	Abbyland Foods, Inc.	Curtiss	WI	-90.431	44.946
P17764B	ABBYLAND FOODS	ABBOTSFORD	WI	-90.309	44.946
P17766	Southern Hens, Inc	Moselle	MS	-89.306	31.526
P17775	Swift Pork Company	Ottumwa	IA	-92.394	41.004
P17778	ENA Meat Packing Corp.	Paterson	NJ	-74.165	40.928
P17778A	E.N.A. Meat Packing Inc.	Paterson	NJ	-74.164	40.928
P17781	Sea Bend Meat Company	Shoreline	WA	-122.347	47.749
P17789B	RMH Foods, LLC	Morton	IL	-89.485	40.609
P1779	T. Hasegawa USA, Inc.	Cerritos	CA	-118.033	33.867
P17807	Food Ingredients Technology Company, LLC	Anniston	AL	-85.772	33.619
P17810	Stevens Brothers, LLC	Panama	NY	-79.499	42.017
P17814	Grand Valley Foods	Grand Junction	CO	-108.632	39.11
P1782	Ensign Meats Inc.	Inglewood	CA	-118.349	33.97
P17820	Sunset Foods	West Des Moines	IA	-93.727	41.565
P17821	Gung Ho Corp.	Bellwood	IL	-87.866	41.89
P17823	JBS Prepared Foods, Inc.	Manteca	CA	-121.261	37.799
P17839A	Baratta Brothers Inc DBA Fairway Packing Co.	Fraser	MI	-82.934	42.554
P17852	Lyons Health Labs Holdco, LLC	Quakertown	PA	-75.361	40.457
P1786	Bay Lake Farms, LLC	Groveland	FL	-81.905	28.468
P17863	I-65 BBQ, Inc.	Nashville	TN	-86.823	36.188
P17866	Alaska Sausage Company, Inc.	Anchorage	AK	-149.898	61.194
P17872	Circle Pines Sausage Haus, Inc.	Circle Pines	MN	-93.171	45.136
P17874	P&F Meat Market	LANDOVER	MD	-76.861	38.943
P1788	Steadfast Farms Poultry Processing & Slaughter LLC	Bethlehem	CT	-73.212	41.635
P17882	El Toro Meat Packing Inc	Miami	FL	-80.21	25.84
P17887	Carnis Meat Processing LLC	Bismarck	ND	-100.777	46.833
P17888	Francisco's Meat Company	Anaheim	CA	-117.861	33.858
P1789	Randall Bakery	Hialeah	FL	-80.288	25.848
P17891	Custom Food Solutions, LLC	Louisville	KY	-85.566	38.208
P17898	Calumet Diversified Meats Inc.	Pleasant Prairie	WI	-87.903	42.509
P1793	WCD Kitchen - Daytona	Daytona Beach	FL	-81.095	29.203
P17937	Ruprecht Company	Mundelein	IL	-87.982	42.254
P17938	Publix Supermarkets, Inc., Deli Plant	Lakeland	FL	-82.012	28.041
P17956	Creative Culinary Specialties, Inc.	Tampa	FL	-82.542	28.014
P1796	JB, LLC	Harmon	GU	144.788	13.495
P17961	Mitchell Foods, Inc.	Baily Switch	KY	-83.922	36.767
P17966	HVFG, LLC	Ferndale	NY	-74.743	41.753
P17967	Los Altos Beef, Inc.	Huntington Park	CA	-118.236	33.978
P1797	Picciocchi's Pasta	Scranton	PA	-75.666	41.408
P17977	Jimbonitas LLC	Hatton	ND	-97.453	47.643
P17978	Bonavista foods Inc.	Ovid	NY	-76.831	42.681
P17980	Pilgrim's Pride Corporation	Sumter	SC	-80.366	33.863
P17982	Michael's Finer Meats, LLC	Columbus	OH	-83.114	40.005
P17986	Michael's Provision	Fall River	MA	-71.152	41.721
P17990A	AVA Pork Products, Inc.	Hicksville	NY	-73.541	40.765
P17991	Nuevo Mundo Foods LLC	Corona	NY	-73.868	40.746
P17994	Bertolino Foods, Inc.	Peabody	MA	-70.979	42.52
P17999	Boston Salads and Provisions Company Inc.	Boston	MA	-71.071	42.33
P18	Pitman Farms	Dayton	VA	-78.938	38.413
P18019	Plenus Group, Inc.	Lowell	MA	-71.28	42.628
P18022	Peter's Wholesale Meat Corporation	Springfield Gardens	NY	-73.768	40.66
P18035	Chair City Meats Inc.	Gardner	MA	-71.996	42.571
P1804	Cargill Kitchen Solutions, Inc.	Lake Odessa	MI	-85.136	42.793
P18043	J.A.K. Inc.	Bloomfield	NJ	-74.199	40.794
P18049	Lombardi Brothers Meats LLC	Denver	CO	-104.916	39.775
P18057	American Meat Companies	Pico Rivera	CA	-118.096	34.003
P1806	Fermentato	Las Vegas	NV	-115.154	36.001
P18073	T.C. Trading Company	Blaine	WA	-122.728	48.99
P18075A	Three Sons Processing-Texas, Inc.	DFW Airport	TX	-97.016	32.882
P18076	Green Bay Dressed Beef, LLC	Green Bay	WI	-88.003	44.516
P18077	Best Foods Products II	Stone Mountain	GA	-84.188	33.808
P1809	Catelli Brothers Inc.	Collingswood	NJ	-75.089	39.922
P18098	Miami Purveyors, Inc.	Miami	FL	-80.315	25.778
P18123	Grecian Delight Foods Inc.	Elk Grove Village	IL	-87.978	42.008
P18144	Smithfield Packaged Meats Corp.	Carroll	IA	-94.86	42.062
P18154	Indian Valley Meats, Inc.	Indian	AK	-149.521	60.992
P1816	West Michigan Beef Co. LLC	Hudsonville	MI	-85.857	42.872
P18162	Pinata Foods, Inc.	Cleveland	OH	-81.731	41.457
P18169	Lee's Meats & Sausage, Inc.	Tea	SD	-96.855	43.462
P18174	Lucksen Trading Co.	Arcardia	CA	-118.035	34.107
P18178	Sterling Pacific Meat Co.	Commerce	CA	-118.15	33.979
P18193	Cangialosi Specialty Sausage Company, Inc.	Greensboro	NC	-79.976	36.096
P1821	RBR Meat Co., Inc.	Vernon	CA	-118.209	33.996
P18213	Cooper Hatchery, Inc.	Van Wert	OH	-84.57	40.906
P18217	Cherry Meat Packers, Inc.	Chicago	IL	-87.695	41.807
P18227	Andy's Deli & Mikolajczk	Chicago	IL	-87.727	41.887
P18235	Fresh Foods of Washington LLC	Everett	WA	-122.253	47.943
P18237	Vital Foods, LLC	Abbeville	SC	-82.407	34.169
P18239	Sterigenics-Mulberry	Mulberry	FL	-81.984	27.899
P18252	Harvest Farms Solutions, Inc.	Lancaster	CA	-118.135	34.701
P18263	Gordo's LLC	Atlanta	GA	-84.426	33.71
P18285	Perdue Foods LLC	Dillon	SC	-79.395	34.471
P18288	Montalvan's Sales	Ontario	CA	-117.617	34.033
P18297	Bellisio Foods, Inc.	Jackson	OH	-82.631	39.055
P1830	Bergeron's Red Pig Group LLC	Port Allen	LA	-91.249	30.458
P18301	Asahi Foods Inc.	Los Angeles	CA	-118.207	34.017
P18315	Bush Brothers Provision Company	Royal Palm Beach	FL	-80.204	26.705
P18318	Sausage World, inc.	Stone Mountain	GA	-84.187	33.83
P1832	Helena Farm	Sumner	IL	-87.906	38.613
P1833	TCM Foods	Elmsford	NY	-73.815	41.074
P18338	Conagra Brands (Conagra Foods Packaged Foods LLC)	Troy	OH	-84.188	40.026
P18341	Crescent Prime Cuts, Ltd.	Farmingdale	NY	-73.415	40.755
P18342	Mannino's Wholesalers Corp	Hauppauge	NY	-73.246	40.809
P18349	Reggio's Pizza, Inc.	Chicago	IL	-87.634	41.744
P18350	Traditions Prepared Meals, LLC	Pearl	MS	-90.063	32.275
P18355	CARLE'S BRATWURST, INC.	Bucyrus	OH	-82.96	40.811
P18356	Ajinomoto Foods North America	Portland	OR	-122.751	45.632
P18356B	Ajinomoto Toyo Frozen Noodle, Inc.	Portland	OR	-122.744	45.629
P18357	Monogram Foods	Plover	WI	-89.547	44.477
P18357A	Monogram Appetizers, LLC	Plover	WI	-89.495	44.457
P18364	George Frozen Foods	Linden	NJ	-74.257	40.643
P18370	Hometown Sausage Kitchen	East Troy	WI	-88.363	42.806
P18380	Pat's Wholesale Meat & Pizza Supply	Blue Island	IL	-87.681	41.667
P18387	At Last Gourmet Foods	Minneapolis	MN	-93.241	44.959
P18388	Kayem Foods Inc.	Woburn	MA	-71.143	42.505
P18389	Orchard Sausages, Inc.	Brooklyn	NY	-73.935	40.707
P18395	Four Star Foods	Chicago	IL	-87.671	41.847
P18398	Wang Shi Corporation	Long Island City	NY	-73.93	40.741
P184	Pilgrim's Pride Corporation	Elberton	GA	-82.838	34.098
P1840	Dakota Butcher	Watertown	SD	-97.136	44.89
P18401	Gosar Natural Foods L.L.C.	Monte Vista	CO	-106.076	37.612
P18403	Van-Lang Enterprises, Inc.	Countryside	IL	-87.861	41.796
P18405A	New Cheung's Meat Wholesale In	Brooklyn	NY	-73.948	40.707
P18414	MB Consultants LTD	South Fallsburg	NY	-74.632	41.707
P18416	New York Food Service, Inc.	Bronx	NY	-73.873	40.807
P18418	Johns Genova Delicatessen, Inc.	Walnut Creek	CA	-122.08	37.898
P18426	Corky's Food Manufacturing, LP	Memphis	TN	-90.032	35.067
P18432	Bangkok Meatball Corp. #2	Lynwood	CA	-118.215	33.939
P18435	Lineage Logistics Services, LLC	Tar Heel	NC	-78.804	34.753
P18438B	Dupont Market, Inc. dba Grimaud Farms	Stockton	CA	-121.252	37.963
P1844	Ivy Log Meat Processing, LLC	Blairsville	GA	-84.033	34.936
P18442	Ba Le Meat Processing	Des Plaines	IL	-87.921	42.024
P18443	Stoney Point, Inc.	Littlestown	PA	-77.11	39.731
P18443A	Stoney Point, Inc.	Littlestown	PA	-77.085	39.747
P18449	WING Y Meats Inc.	Brooklyn	NY	-73.935	40.726
P18450	Gourmet Kitchen Inc	Neptune	NJ	-74.022	40.21
P18468	Kettle Cuisine Midco, LLC	Lynn	MA	-70.948	42.457
P18485	Hotpie Incorporated	Fort Pierce	FL	-80.405	27.471
P1849	Gleaners Food Bank	Indianapolis	IN	-86.261	39.711
P18491	EASTERN SHORE POULTRY COMPANY, INC	GEORGETOWN	DE	-75.349	38.69
P18498	Woodridge 31 Copacking Company LLC	Chicago	IL	-87.731	41.837
P18498A	Woodridge 31 Copacking Company LLC	Woodridge	IL	-88.014	41.697
P18502B	Missa Bay LLC	Swedesboro	NJ	-75.334	39.767
P18504	King Kold	Englewood	OH	-84.304	39.883
P18504A	King Kold, Inc.	Englewood	OH	-84.304	39.883
P18506	Pride Enterprise Food Products	Raiford	FL	-82.193	30.066
P18510	Werner Gourmet Meat Snacks Inc.	Tillamook	OR	-123.834	45.455
P18512	Dave's Salad House	Elizabeth	NJ	-74.211	40.675
P1852	Origami Catering	Portland	OR	-122.676	45.562
P18524	Steve's Meat Market, Inc.	Ellendale	MN	-93.297	43.873
P18526	Los Primos Meats Inc.	Brooklyn	NY	-73.937	40.712
P18527	Prime Meats LLC	Tucker	GA	-84.192	33.86
P18530	Envision Cold	Austin	MN	-92.956	43.685
P18532	Costco Wholesale Meat Plant	Tracy	CA	-121.531	37.721
P18548	Li Chuen Company, Inc.	New York	NY	-73.939	40.712
P1855	Sinzenard International Foods	St. Louis	MO	-90.27	38.593
P18554	JCG Industries	Chicago	IL	-87.741	41.958
P18554A	JCG Industries	Franklin Park	IL	-87.863	41.918
P18557	Sanderson Farms, Inc.	Summit	MS	-90.373	31.272
P18559	Grand Food	Hayward	CA	-122.118	37.622
P18563	Crown Meat & Provisions	Palm Springs	CA	-116.495	33.814
P18567	E&M Innovative Forager, LLC	Deerfield Beach	FL	-80.127	26.307
P1857	Cypress Cold Storage, LLC	North Little Rock	AR	-92.249	34.769
P18578	Kellys Foods, Inc.	Winter Garden	FL	-81.566	28.558
P18581	Suitor Meat Co., Inc.	Rienzi	MS	-88.572	34.797
P18583	Green Meadows Foods, Inc	Paxton	IL	-88.098	40.463
P18591	Onion Crock of Michigan	Grand Rapids	MI	-85.687	42.986
P18596	K&L Ranch Inc.	Paterson	NJ	-74.188	40.924
P18600	Greco and Sons	Bartlett	IL	-88.236	41.984
P1863	D & J Custom Cutting LLC	Hartly	DE	-75.69	39.167
P18632	Very Good Meat Company	Hudson	SD	-96.454	43.132
P18636	Mad Butcher Meat Co. Inc.	Sacramento	CA	-121.391	38.509
P18639	Pede Brothers Incorporated	Schenectady	NY	-74.003	42.79
P18642	Three Paisano's Food Service Inc.	South Toms River	NJ	-74.217	39.939
P18646	Coblentz Distributing, Inc	Millersburg	OH	-81.76	40.544
P18654B	Tipico Food Inc.	Gardena	CA	-118.303	33.902
P18654C	Baram Foods LLC	Gardena	CA	-118.304	33.902
P18657	Niagara Specialty Foods, Inc.	Kenmore	NY	-78.879	42.973
P18661	Mega Meats	Bronx	NY	-73.86	40.867
P18667	Ellsworth Foods Inc.	Tifton	GA	-83.537	31.444
P18669	Midamar Corporation	Cedar Rapids	IA	-91.685	41.919
P18673	Hermanos Santiago Cash & Carry	Ponce	PR	-66.584	18.042
P18673A	Manhattan Packing, Inc.	Ponce	PR	-66.599	18.016
P18678	Fells Point, LLC	Baltimore	MD	-76.659	39.274
P18691	Landes Fresh Meats, Inc	Clayton	OH	-84.334	39.881
P18701	NYS DOCS, OFFICE OF NUTRITIONAL SERVICES/FOOD PRODUCTION CENTER	ROME	NY	-75.48	43.184
P18714	Lord's Meats, Inc.	Dexter	GA	-83.054	32.432
P18715	Garfield Locker	Garfield	MN	-95.486	45.934
P18718	Sausage Factory Inc.	Los Angeles	CA	-118.356	34.049
P18726	Premio Foods, Inc.	Brooksville	FL	-82.462	28.48
P1874	Mondo & Sons	Tukwila	WA	-122.25	47.445
P18743	Olympia Food Industries, Inc.	Franklin Park	IL	-87.864	41.924
P18746	Lindsay Foods, Inc.	Milwaukee	WI	-87.941	43.022
P18766	MABELS PLACE CORP	Hallandale Beach	FL	-80.164	25.989
P18769	Rochelle Foods, Inc.	Rochelle	IL	-89.051	41.91
P18780	R. L. Schreiber Inc.	Lebanon	KY	-85.244	37.592
P18781	Golden Krust Patties Inc.	Bronx	NY	-73.902	40.842
P1879	Lloyd's Barbeque Company, LLC	St. Paul	MN	-93.171	44.866
P18797	Kitchen Fresh Foods, LLC	Green Bay	WI	-88.074	44.579
P18799	Gourmet Boutique, LLC	Jamaica	NY	-73.779	40.666
P18799A	Gourmet Boutique, LLC SAT	Jamaica	NY	-73.774	40.663
P1880	Neighbors Meats LLC	New Richland	MN	-93.496	43.893
P1882	Danielson Food Products, Inc.	Chicago	IL	-87.632	41.819
P18820	Mathew's Prime Meats, Inc.	West Babylon	NY	-73.356	40.709
P18823	Fortune Avenue Foods, Inc.	Ontario	CA	-117.587	34.035
P18823A	Fortune Avenue Foods, Inc.	Ontario	CA	-117.587	34.035
P18826A	Faribault Foods, Inc.	Faribault	MN	-93.289	44.328
P18831	Campbell Soup Supply Co., LLC	Milwaukee	WI	-87.918	42.953
P18832	M&P Production LTD	Brooklyn	NY	-73.997	40.647
P18835	Grand Banks Specialty Food, LLC	Naugatuck	CT	-73.044	41.51
P1884	Del Popolo LLC	San Francisco	CA	-122.415	37.77
P18846	McCain Foods USA, Inc.	Appleton	WI	-88.449	44.267
P1885	Colinas Products LLC	Round Rock	TX	-97.61	30.498
P18850	COQUI MEATS LLC	Bayamon	PR	-66.194	18.276
P18855	Reynaldo's Mexican Food Company, LLC	Vernon	CA	-118.214	34.006
P18859	North American Bison, LLC	New Rockford	ND	-99.117	47.653
P18860	Sing Wah Live Poultry Mkt Inc	Brooklyn	NY	-74.003	40.685
P18862	Kim Son Food Co.	San Leandro	CA	-122.184	37.719
P1887	Marcel's Portion Pak, Inc	Opa-Locka	FL	-80.265	25.895
P18876	OMH Cook Chill Production Center	Orangeburg	NY	-73.976	41.043
P18878	Piccinini Brothers, Inc	New York	NY	-73.992	40.76
P18881	Square H Brands, Inc.	Los Angeles	CA	-118.22	34.012
P18881A	Square-H Brands, Inc.	Vernon	CA	-118.206	34.006
P18888	Brighton Packing LLC	Chicago	IL	-87.694	41.806
P1889	Violet Sanford Holdings, LLC	Sanford	NC	-79.23	35.525
P18894	Timberline Meats, LLC	Dundee	NY	-77.035	42.555
P18895	US Foods, Inc.	Hawthorne	CA	-118.361	33.919
P18897	Cueritos and  Botanas Coahuila	Pomona	CA	-117.752	34.092
P18898	Johnson Meat Co., Inc.	Tampa	FL	-82.449	28.032
P18901	Sugartown Smoked Specialties	West Chester	PA	-75.589	39.962
P18931	New Specialty Products, Inc.	Chicago	IL	-87.661	41.808
P18935	Givaudan Flavors Corporation	Florence	KY	-84.627	38.965
P18938	T & B Food Corp.	College Point	NY	-73.839	40.784
P18943	S & S Institutional Foods	Atlanta	GA	-84.409	33.793
P18951	Prime Snax Inc.	Salt Lake City	UT	-111.907	40.732
P18963	Quincy Street, Inc.	Holland	MI	-86.112	42.84
P18969	Contes Pasta Co., Inc.	Vineland	NJ	-75.018	39.51
P18978	Misty Knoll Farms	New Haven	VT	-73.148	44.125
P18987	JRG Meat Processing Plant	Aibonito	PR	-66.262	18.115
P18988	Little Town Jerky Co Inc.	Falmouth	MI	-85.086	44.243
P18988A	Ebels Family Center, Inc.	Falmouth	MI	-85.086	44.243
P18988B	Ebels Meat Processing	Falmouth	MI	-85.086	44.243
P18994	The 29ers Provisions	Los Angeles	CA	-118.242	34.004
P18995	California Jerky Factory, Inc.	S. El Monte	CA	-118.044	34.052
P18995A	Bach Cuc Beef Jerky, Inc	S. El Monte	CA	-118.05	34.058
P18A	Pitman Farms	Mt. Crawford	VA	-78.935	38.377
P19	Smithfield Packaged Meats Corp.	Omaha	NE	-95.961	41.208
P190	Jennie-O Turkey Store, Inc.	Barron	WI	-91.848	45.402
P19009	LiDestri Foods Inc.	Fresno	CA	-119.663	36.728
P19011	Ian's Corporation, DBA Hudson River Foods	Castleton	NY	-73.753	42.541
P19028	KAHIKI FOODS, INC.	Gahanna	OH	-82.855	39.99
P1903	Pasou Foods, Inc.	Syracuse	IN	-85.746	41.409
P19034	Berk Lombardo Packing Co.. Inc.	Hauppauge	NY	-73.225	40.811
P19049	University of Arizona Food Products & Safety Lab	Tucson	AZ	-110.944	32.283
P19051	Smithfield Fresh Meats Corp.	Denison	IA	-95.36	42.028
P19056	Let's Do Lunch, Inc.	Gardena	CA	-118.279	33.885
P19063	Performance Foodservice	Dover	FL	-82.237	27.994
P19066	Fred Usinger, Inc.	Milwaukee	WI	-87.908	43.026
P19076	The Wornick Company	Cincinnati	OH	-84.376	39.261
P19076B	The Wornick Company dba Baxters North America, Inc.	Cincinnati	OH	-84.379	39.261
P19079	Hoskie Co. Inc.	Brooklyn	NY	-73.928	40.707
P19083	O'Tasty Foods, Inc.	City of Industry	CA	-117.957	34.021
P19085	CTI Foods LLC.	Owingsville	KY	-83.772	38.127
P1909	Legacy Agricultural Farms LLC	Hempstead	TX	-95.981	30.157
P19099	Prime Food Processing, LLC	Brooklyn	NY	-73.934	40.716
P19109	Hearthside Food Solutions, LLC	Shakopee	MN	-93.453	44.786
P19112	Perdue Foods LLC	Cromwell	KY	-86.787	37.343
P19113	Stampede Culinary Partners, Inc.	Bridge View	IL	-87.812	41.758
P19113A	Stampede Culinary Partners, Inc.	Oak Lawn	IL	-87.759	41.694
P19113B	Stampede Culinary Partners, Inc.	Bedford Park	IL	-87.797	41.773
P19113N	Stampede Culinary Partners, Inc.	Sunland Park	NM	-106.643	31.863
P1912	Chapel Ford Farm, LLC	Gettysburg	PA	-77.23	39.754
P19128	Case Farms Processing	Dudley	NC	-78.001	35.324
P19132	New Boston Meats Co., Inc.	Boston	MA	-71.067	42.329
P1915	Green Top Farms	Brooklyn	NY	-73.936	40.712
P19150	La Belle Farm Inc	Ferndale	NY	-74.741	41.744
P19151	H.M.G. Processing LLC	Youngstown	OH	-80.639	41.117
P19152	Koch Foods LLC	Morristown	TN	-83.296	36.14
P19160	Al Shabrawy Inc.	South River	NJ	-74.379	40.451
P19168	Lineage Logistics, LLC	Tacoma	WA	-122.402	47.246
P19177	Mucci Food Products Ltd	Canton	MI	-83.452	42.342
P1918	Orange Custom Game Processing	Orange	VT	-72.39	44.143
P19188	Tuv Taam Corp	Brooklyn	NY	-73.954	40.699
P19191A	San Francisco Foods, LLC	San Leandro	CA	-122.173	37.698
P19194	US Foods, Inc.	Phoenix	AZ	-112.159	33.437
P19198	Bakkavor Foods USA, Inc	Charlotte	NC	-80.95	35.133
P192	Pilgrim's Pride Corporation	Guntersville	AL	-86.284	34.346
P1921	Nom Nom Dumplings, LLC.	New York	NY	-73.994	40.72
P19212	Shanghai Egg Rolls Co.	Beckley	WV	-81.192	37.774
P19222	Quality Meats Processors	Caguas	PR	-66.028	18.226
P19232	Bowman & Landes Turkeys, Inc.	New Carlisle	OH	-84.096	39.912
P19237	Utah State University Meat Science Lab	Wellsville	UT	-111.889	41.669
P1924	Tad-Tony Operations, LLC	Baton Rouge	LA	-91.119	30.451
P19252	The Butcher Block	Oakland	MD	-79.357	39.404
P19254	Link Snacks, Inc.	Alpena	SD	-98.367	44.181
P19254A	LSI, Inc.	Alpena	SD	-98.37	44.187
P1926	Paradox Foods LLC	Oceanside	CA	-117.27	33.214
P19263A	Pulmuone Foods USA, Inc.	Gilroy	CA	-121.548	36.986
P19263B	Pulmuone Foods USA Inc.	Mira Loma	CA	-117.521	34.027
P19268	Commercial Food Services	Salt Lake City	UT	-111.893	40.696
P19278	The Butcher Shop Inc	Columbia	SC	-81.115	34.029
P1928	Palermo's Villa Inc.	Jefferson	WI	-88.814	42.99
P19290	Working H Meats, LLC	Friendsville	MD	-79.392	39.639
P19299	Jennie O Turkey Store Sales, LLC	Montevideo	MN	-95.699	44.954
P19300	Skyline Provisions	Harvey	IL	-87.635	41.586
P1932	R&V Products Distributors Inc.	National City	CA	-117.103	32.656
P1933	Sierra Skins Inc.	Los Angeles	CA	-118.253	34.025
P19339	Vanee Foods Company	Broadview	IL	-87.861	41.854
P19340	Bromley Meats	Miami	FL	-80.191	25.944
P19349	Sugar Creek Packing Company	Washington Court House	OH	-83.408	39.536
P19349B	Sugar Creek Packing Co.	Dayton	OH	-84.255	39.763
P19349C	Sugar Creek Packing Co.	Hamilton	OH	-84.471	39.316
P19349D	Sugar Creek	Fairfield	OH	-84.481	39.327
P19349E	Sugar Creek	Cambridge City	IN	-85.152	39.842
P19349G	Sugar Creek Packing Co.	Washington Court House	OH	-83.41	39.533
P1936	Smithfield Packaged Meats Corp.	Kinston	NC	-77.658	35.269
P1937	Steinbach Foods LLC	Chicago	IL	-87.694	41.806
P19375	LTF Family Farm	Oak Hill	OH	-82.463	38.897
P19376	Seattle Egg Roll Corp	Auburn	WA	-122.221	47.328
P19378	Koch Foods of Cumming	Cumming	GA	-84.139	34.201
P1938	Frango Mineiro Live Butcher Shop LLC	Warwick	MD	-75.78	39.414
P19387	Glenoaks Food, Inc.	Sun Valley	CA	-118.372	34.236
P19393	AMPC LLC.	Harlan	IA	-95.305	41.645
P19409	Siemer Distributing Co., Inc.	New Lexington	OH	-82.185	39.709
P1941	Sugarloaf Mountain Meats and Processing	Morehead	KY	-83.523	38.211
P19415	Smithfield Packaged Meats Corp.	Springfield	MA	-72.537	42.145
P19433	Ambassador Meat Distributor, Inc	Kansas City	MO	-94.547	39.12
P19435	Monogram Foods	Denison	IA	-95.364	42.009
P19439	Fiore Di Pasta, Inc.	Fresno	CA	-119.739	36.706
P19444	Nor-Am Cold Storage, Inc	Saint Joseph	MO	-94.861	39.734
P19449	Blount Fine Foods	Warren	RI	-71.285	41.727
P19449A	Blount Fine Foods	Fall River	MA	-71.106	41.743
P19451A	Apex Cold Storage Co.	Fife	WA	-122.382	47.238
P19453	Soup Bases Loaded	Ontario	CA	-117.601	34.041
P19455	Dickinson & Son 84 Packing Co., Inc.	Eighty Four	PA	-80.119	40.18
P19456A	Rio Star Foods, Inc.	Dallas	TX	-96.873	32.772
P1946	Tutta Bella Culinary	Seattle	WA	-122.325	47.567
P19472	Philly's Best Steak Company, Inc.	Yeadon	PA	-75.261	39.938
P19472A	Philly's Best Steak Co., Inc.	Yeadon	PA	-75.262	39.937
P19476	A.N. Deringer, Inc.	Sweetgrass	MT	-111.968	48.997
P1947A	Halperns' Steak and Seafood Company LLC	Kalamazoo	MI	-85.535	42.248
P1949	Simmons Prepared Foods, Inc.	Gentry	AR	-94.45	36.299
P19490	Lake Erie Frozen Foods Mfg. Co.	Ashland	OH	-82.303	40.887
P19504	AdvancePierre Foods, Inc	Vineland	NJ	-75.053	39.527
P19511	Wilkes Abattoir, LLC	North Wilkesboro	NC	-81.156	36.193
P19511A	Wilkes Abattoir, LLC	N. Wilkesboro	NC	-81.136	36.162
P19514	Tyson Foods, Inc.	Robards	KY	-87.519	37.655
P1952	Art Gourmet Catering Corp	Tewksbury	MA	-71.23	42.61
P19523	Simmons' Barbecue Inc	Guntersville	AL	-86.303	34.348
P19527	Five Star Food Products, Inc.	Bethpage	NY	-73.499	40.756
P19545A	Integrity Foods Inc.	Athens	GA	-83.345	33.982
P19555	US Import Meat Inspection	Sweetgrass	MT	-111.969	48.995
P19562	Country Home Processing LLC	Albion	IL	-88.032	38.381
P19566	Alex's Meat & Provisions	Brooklyn	NY	-74.022	40.647
P19566A	Mr. Pierogi	Brooklyn	NY	-73.993	40.67
P19575	Boar's Head Provisions Co., Inc.	Forrest City	AR	-90.814	34.996
P1957A	Chicago Meat Authority	Chicago	IL	-87.653	41.807
P19596	Christian Aid Ministries	Ephrata	PA	-76.106	40.142
P19605	Papetti's Hygrade Egg Products, Inc.	Klingerstown	PA	-76.697	40.66
P19617	Pederson's Natural Farms, INC.	Hamilton	TX	-98.131	31.691
P1962	Perry Way Foods, LLC	Watertown	WI	-88.756	43.177
P19636	Tyson Foods Inc	Union City	TN	-89.01	36.42
P19644	Vergos International Products, Inc	Memphis	TN	-90.049	35.154
P19646	Bernatello's Pizza, Inc.	Kaukauna	WI	-88.261	44.296
P19652	Swift Beef Company	Greeley	CO	-104.688	40.444
P19665	E-Z Shop Kitchen, Inc.	Fremont	OH	-83.102	41.35
P19682	LSG Sky Chefs	Orlando	FL	-81.317	28.442
P19688	Sanderson Farms, Inc.	Bryan	TX	-96.416	30.649
P19689	City Foods, Inc./Bea's Best Corned Beef	Chicago	IL	-87.656	41.817
P19690	Atlantic Coast Freezers, LLC	Vineland	NJ	-75.025	39.518
P19692	AdvancePierre Foods, Inc.	Enid	OK	-97.808	36.419
P19697	Chaudhry Meat Company, Inc.	Siler City	NC	-79.499	35.74
P1970	Chops and Steaks LLC	North Brunswick	NJ	-74.528	40.44
P19705	Mariah Foods	Columbus	IN	-85.91	39.199
P19710	Golden Phoenix International Foods., Inc.	St. Louis	MO	-90.198	38.613
P19717	Lynch BBQ Company	Decorah	IA	-91.737	43.297
P19719	Twin Rivers Foods	Fort Smith	AR	-94.427	35.391
P19719E	Twin Rivers Foods	Ft. Smith	AR	-94.426	35.394
P1973	Brook Meadow Fresh Farm, LLC	Harrisburg	PA	-76.89	40.285
P19734	Scimeca's Sausage Co.	Kansas City	MO	-94.562	39.104
P19744	Fuji Foods, Inc.	Burlington	NC	-79.435	36.134
P1975	Raw Basics LLC	St. Francis	WI	-87.873	42.97
P19753	Wenzel's Farm, LLC	Marshfield	WI	-90.175	44.64
P19756	Sugar Creek Packing co.	Frontenac	KS	-94.723	37.454
P19764	Burris Logistics	Los Angeles	CA	-118.224	34.042
P19765	Texas Chaw	Caldwell	TX	-96.715	30.529
P19776	Red Smith Foods, Inc.	Davie	FL	-80.213	26.07
P1978	Greener Pastures Chicken	Elgin	TX	-97.327	30.348
P19781	Croissant Etc. Corp.	Oak Creek WI	WI	-87.914	42.914
P19782	E. Excel Food Inc	Anaheim	CA	-117.839	33.856
P19786	Prima Sausage Co Inc	Medley	FL	-80.321	25.846
P19789	4-L Processing	Como	TX	-95.433	32.92
P19790	Lineage Logistics, LLC	Norfolk	VA	-76.329	36.93
P19796	Eastside Cafe	Warrenville	IL	-88.211	41.822
P19804	JM Packing	Ponce	PR	-66.631	18.011
P19809	Major Products	Little Ferry	NJ	-74.036	40.846
P19821	West Liberty Foods, LLC R&D Pilot Plant	West Liberty	IA	-91.256	41.567
P19825	Halal International Processing	York	SC	-81.279	35.001
P19829	Perfect Pasta, Inc.	Addison	IL	-88.017	41.928
P19829J	Perfect Pasta, Inc.	Addison	IL	-88.021	41.917
P19830	Flying Food Group	Newark	NJ	-74.196	40.698
P19833	Koch Foods of Mississippi LLC	Morton	MS	-89.663	32.314
P19834	PF Meats Company	Belton	SC	-82.491	34.523
P19836	Carolina Packers, Inc.	Smithfield	NC	-78.375	35.478
P1984	Southern Ridge Farm LLC	Columbia	TN	-87.057	35.719
P19846	Kah and Company Incorporated	Wapakoneta	OH	-84.18	40.578
P19851	Petty Brothers Meats Inc.	Annandale	MN	-94.118	45.26
P19856A	Top Taste Food, Inc.	Brooklyn	NY	-73.995	40.67
P19860	Northern Tier Bakery, LLC	Saint Paul Park	MN	-93.0	44.847
P19865	House of Raeford Farms of LA	Arcadia	LA	-92.942	32.559
P19870	United States Cold Storage Inc	Warsaw	NC	-78.111	35.016
P19871	House of Raeford Farms, Inc. dba Filet of Chicken	Forest Park	GA	-84.393	33.617
P19872	Empirical Foods, Inc.	So. Sioux City	NE	-96.418	42.431
P19879	Golden Valley Industries	Modesto	CA	-121.023	37.648
P19881	Bylada Foods LLC	Moonachie	NJ	-74.064	40.834
P19881A	Bylada Foods LLC	Camden	NJ	-75.12	39.925
P19884	Rosie's Snacks, Inc.	Swanton	VT	-73.092	44.886
P19887	WILD Flavors, Inc.	Erlanger	KY	-84.615	39.047
P19887A	WILD Flavors, Inc	Erlanger	KY	-84.625	39.045
P19888	Reser's Fine Foods, Inc. DBA Fresh Creative Foods	Vista	CA	-117.226	33.134
P19889	It's Jerky Inc.	Redding	CA	-122.297	40.56
P19894	Weaver Meats Inc	Painesville	OH	-81.26	41.722
P19903	Stevens Sausage Co., Inc.	Smithfield	NC	-78.317	35.463
P19904	Acre Station Meat Farm	Pinetown	NC	-76.822	35.596
P19908	Pruski's Market, Inc.	Adkins	TX	-98.288	29.371
P1991	Wonder Meats Snyder, LLC	Snyder	NE	-96.78	41.706
P19911	Lineage Logistics Services LLC	Allentown	PA	-75.6	40.567
P19915	Corfini Meat and Seafood	Salt Lake City	UT	-111.999	40.733
P19917	Taylor Farms Illinois, Inc	Woodridge	IL	-88.014	41.699
P19918	The Pillsbury Company	Murfreesboro	TN	-86.396	35.806
P1993	Farmington Meat Co. Inc.	Forest Park	IL	-87.811	41.886
P19930B	T&L Creative Salads	Farmingdale	NY	-73.415	40.717
P19941A	Reichel Foods, Inc.	Rochester	MN	-92.466	43.968
P19941W	Reichel Foods Inc.	Rochester	MN	-92.51	44.088
P19950	Empanadas Quintero	Opa-Locka	FL	-80.232	25.904
P19953	Go Go Sales Inc.	Los Angeles	CA	-118.213	34.02
P19957	United States Cold Storage	Minooka	IL	-88.278	41.451
P19959	FCH Enterprises, Inc.	Waipahu	HI	-158.004	21.421
P19964	Shepherd Foods	Springville	UT	-111.651	40.177
P19977	Packer Avenue Foods, Inc	Philadelphia	PA	-75.163	39.909
P19979	Ukrop's Homestyle Foods	North Chesterfield	VA	-77.598	37.501
P1998	Southern Texas Food Group	Eagle Pass	TX	-100.485	28.696
P19980	Pierino Frozen Foods, Inc.	Lincoln Park	MI	-83.187	42.252
P19999	AU, LAU and Associates, Inc.	Pompano Beach	FL	-80.153	26.254
P199D	Research & Development, Hormel Foods Corporate Services, LLC	Austin	MN	-92.972	43.675
P199O	Osceola Food, LLC	Osceola	IA	-93.787	41.024
P199P	Progressive Processing, LLC	Dubuque	IA	-90.767	42.488
P199R	Hormel Foods Group	Algona	IA	-94.223	43.079
P199V	Hormel Foods Corporation	Knoxville	IA	-93.061	41.318
P1AA	Tyson Foods, Inc.	Wilkesboro	NC	-81.162	36.144
P2000	Hahn Bros. Inc.	Westminister	MD	-76.979	39.585
P20023	Bakery Avenue, LLC	Claremore	OK	-95.661	36.262
P20029	Carolina Catering Corp.	Carolina	PR	-65.99	18.431
P20034	Holiday Meats of New Jersey, Inc.	Little Silver	NJ	-74.045	40.329
P20035	Bumble Bee Foods LLC	Cape May	NJ	-74.878	38.957
P20049	Don Miguel Mexican Foods, Inc.	Dallas	TX	-96.706	32.901
P2006	Manea's Meats Company	Sauk Rapids	MN	-94.166	45.591
P20069	Harvest Food Products Co., Inc.	Hayward	CA	-122.127	37.647
P20069A	Harvest Food Products Co., Inc.	Hayward	CA	-122.126	37.648
P20076	Troy Foods Inc	Troy	IL	-89.877	38.718
P2008	Vista Meat Processing 2, LLC	Jurupa Valley	CA	-117.396	34.022
P20088	Brakebush Irving, Inc.	Irving	TX	-96.913	32.823
P20091	Country Ranch Food Products	Marietta	GA	-84.563	33.986
P20093	Fresh Gourmet Cuisine Corp	Northridge	CA	-118.557	34.232
P20103	Carnival Culinary Solutions	Jefferson	LA	-90.139	29.967
P20106	Dallas USA Foods Inc.	Dallas	TX	-96.858	32.774
P20116	BMC Cali, Inc.	Rosemead	CA	-118.083	34.063
P20117	Culinary Specialties Inc.	San Marcos	CA	-117.194	33.137
P20131	S & E Gourmet Cuts Inc.	San Bernardino	CA	-117.263	34.075
P20138	Bo-Bo Poultry Market Inc	Brooklyn	NY	-73.931	40.715
P2015	Schwan's Global Supply Chain, Inc.	Marshall	MN	-95.793	44.469
P20153	Rice Field Corporation	City of Industry	CA	-117.977	34.035
P20156	Majesty Foods	Hialeah	FL	-80.339	25.895
P20172	American Butchers, LLC	Beaver City	NE	-99.829	40.136
P20173	Ivars Commissary	Mukilteo	WA	-122.289	47.892
P2018	The Grain Bin Butchery & Market LLC	Boyecville	WI	-91.933	45.107
P2019	Anderson & Son Meat Processing LLC	Abingdon	VA	-81.966	36.759
P20192	Northwoods Custom Meats, Inc.	Remer	MN	-93.916	47.056
P202	Pel-Freez, LLC	Rogers	AR	-94.115	36.337
P2020	Severino Pasta Mfg Co Inc	Westampton	NJ	-74.861	40.005
P20204	Denmark Sausage LLC	Peoria	AZ	-112.225	33.564
P2020A	Severino Pasta Manufacturing Company	Cherry Hill	NJ	-74.978	39.913
P20214	Wayne Farms LLC	Decatur	AL	-87.048	34.611
P20215	Cajun Specialty Meats	Pensacola	FL	-87.181	30.425
P2023	Bellingar Packing	Ashley	MI	-84.572	43.136
P20232	Slovacek Foods, LP	Snook	TX	-96.478	30.493
P20239	Northwood Foods, LLC	Northwood	IA	-93.22	43.457
P2024	TP Banh Bao Distributor Inc.	San Diego	CA	-117.143	32.927
P20243	LiDestri Foods, Inc.	Fairport	NY	-77.451	43.107
P20245	Keystone Foods, LLC	Albany	KY	-85.182	36.76
P20249	Livingston Meat Processing	Hopkinsville	KY	-87.41	36.951
P2025	Courtesy Ventures LLC	Wixom	MI	-83.515	42.509
P20251	Tecumseh Poultry, Inc	Tecumseh	NE	-96.195	40.365
P20251W	Tecumseh Poultry, LLC	Waverly	NE	-96.544	40.901
P20252	Mom's Wholesale Foods, Inc.	New Castle	PA	-80.35	41.011
P20254	Computer Times Publishing, Inc.	Honolulu	HI	-157.867	21.317
P20256	Broomes Poultry	Albemarle	NC	-80.302	35.345
P2027	L & L Packing Company	Chicago	IL	-87.64	41.82
P2028	Culver Duck Farms, Inc.	Middlebury	IN	-85.699	41.705
P20287	Simmons Prepared Foods, Inc.	Van Buren	AR	-94.337	35.426
P2029	Trim-Rite Food Corporation	Carpentersville	IL	-88.295	42.123
P20290	Targhee Brands, Inc.	Rexburg	ID	-111.766	43.71
P20314	Nina Mia, Inc.	Fullerton	CA	-117.903	33.862
P20322	Keystone Foods, LLC.	Bakerhill	AL	-85.321	31.808
P20322A	Keystone Foods, LLC	Baker Hill	AL	-85.321	31.804
P20326	Coastal Pacific Food Distributors	Stockton	CA	-121.259	37.899
P2035	Stockyards Packing Co LLC	Oxford	OH	-84.792	39.545
P20350	EDS Wrap & Roll Foods, LLC.	Hayward	CA	-122.142	37.656
P2037	Triple A Meat Sales Inc.	Bakersfield	CA	-118.965	35.354
P20373	Americold Logistics	Sebree	KY	-87.527	37.627
P20374	Quality Refrigerated Services	Omaha	NE	-95.963	41.219
P20380	Spagel Brothers Inc.	Erie	PA	-80.061	42.118
P20384	Pasta Mami	Marietta	GA	-84.543	33.926
P20385	Keystone Foods, LLC	Camilla	GA	-84.187	31.277
P20401	Prime Foods, Inc.	Hyattsville	MD	-76.929	38.934
P20401A	Prime Foods	Hyattsville	MD	-76.928	38.934
P20414	Azar and Company	Jacksonville	FL	-81.647	30.331
P20422	Johnson's Smokehouse and Sausage Kitchen	East Olympia	WA	-122.832	46.966
P20425	Texas Best Beef Jerky, Inc.	Wichita Falls	TX	-98.614	33.866
P2043	Warabeya North America, Inc	Stafford	VA	-77.428	38.412
P20434	Barry's Barbeque	Fyffe	AL	-85.929	34.49
P20435	La Molisana Sausage Company LLC	Waterbury	CT	-73.049	41.541
P20446	Central Illinois Poultry Processing LLC	Arthur	IL	-88.472	39.736
P20477	Casa Di Carfagna	Columbus	OH	-82.926	40.078
P20478	Snow Creek Meat Processing, Inc.	Seneca	SC	-83.002	34.613
P20481	Bluebonnet Foods LP	San Antonio	TX	-98.421	29.54
P20485	G&C Food Distributors, Inc.	Syracuse	NY	-76.277	43.107
P2049	Iowa State University Meat Laboratory	Ames	IA	-93.643	42.03
P20491	Tuff Stuff Jerky Company	Browns Valley	CA	-121.345	39.323
P20498	Kevin's Quality Meats	Kittanning	PA	-79.522	40.82
P20504	L.S. Reyes Products	Tumon	GU	144.815	13.521
P2051	Levoni America Corporation	Millville	NJ	-75.066	39.372
P20513	Comeaux's Inc	Breaux Bridge	LA	-91.901	30.293
P20516	Evans Meats, Inc.	Birmingham	AL	-86.797	33.524
P20528	Springville Meat & Cold Storage Co. Inc.	Springville	UT	-111.613	40.163
P20535	Hato Rey Meat Packing	Hato Rey	PR	-66.05	18.417
P20552	SK Food Group	Reno	NV	-119.774	39.467
P20569	Trafon Group, Inc.	Puerto Nuevo	PR	-66.101	18.428
P2057	Chicago Meat Authority	Chicago	IL	-87.654	41.808
P20575	Rains Natural Meats	Gallatin	MO	-93.91	39.933
P20581	Atkins Sheep Ranch Inc.	Fremont	CA	-121.988	37.516
P20583	Martinez Distributors	Miami	FL	-80.317	25.802
P20594	Tooele Valley Meat	Grantsville	UT	-112.417	40.6
P206	Pilgrim's Pride Corporation	Nacogdoches	TX	-94.649	31.589
P2060	Country Smoke House Inc	Almont	MI	-83.058	42.97
P20600	Pasquale's Food Service Inc.	Humboldt	IA	-94.219	42.721
P20604	Gerber Poultry, LLC	Kidron	OH	-81.746	40.728
P20606	ConAgra Brands, Inc,	Darien	WI	-88.736	42.591
P20608	The Pork Company	Warsaw	NC	-78.123	35.007
P2062	A & M Meat Processing, LLC.	Alamogordo	NM	-105.965	32.946
P2063	Quality Meats and Seafood	West Fargo	ND	-96.902	46.884
P20634	Cucina Della Cucina, LLC.	San Fernando	CA	-118.438	34.278
P20637	Wilson Packing Company	Wilson	NC	-77.907	35.697
P20646	Glazed Honey Ham Co	Lubbock	TX	-101.89	33.52
P20647	Clarmil Manufacturing Corporation	Hayward	CA	-122.053	37.615
P2065	Picoso Foods, LLC	Albuquerque	NM	-106.59	35.129
P20650	The Pasty Oven, Inc.	Florence	WI	-88.238	45.927
P20659	Peco Foods of Mississippi	Canton	MS	-90.073	32.598
P2066	Quality Halal Processors	Harrisburg	PA	-76.882	40.283
P20668	Joseph's Gourmet Pasta	Haverhill	MA	-71.087	42.784
P20670	Steve's Meat Market	De Soto	KS	-94.964	38.975
P20672	Central Meat Processors, Inc.	Cayey	PR	-66.141	18.119
P20676	Supreme Meat Purveyors LLC	San Antonio	TX	-98.499	29.408
P20680	Sonny's 10th Avenue Meat Market Inc.	New York	NY	-73.991	40.766
P20699A	Alatrade Foods, Inc.	Boaz	AL	-86.18	34.221
P2071	Park Ranch Meats LLC.	Minden	NV	-119.742	38.963
P20710	Burnette Foods Inc.	East Jordan	MI	-85.122	45.152
P20717	Medina Meats, Inc/Medina Foods	Litchfield	OH	-82.038	41.184
P2072	Brookshire Brothers, Inc.	Lufkin	TX	-94.724	31.369
P20722	JBS Prepared Foods	Council Bluffs	IA	-95.885	41.243
P20728	Pilgrim's Pride Corporation	Waco	TX	-97.127	31.61
P2073	C & F Packing Company	Lake Villa	IL	-88.07	42.41
P20744	Summit Cold Storage, Inc.	Summit	IL	-87.812	41.792
P20747	Baffo's Enterprises	Riverview	MI	-83.189	42.173
P20758	Truvant, LLC	Boscobel	WI	-90.693	43.142
P20761	PFG Virginia Foodservice	Glen Allen	VA	-77.463	37.694
P20766	Arko Veal Company, Inc.	Forest Park	GA	-84.376	33.623
P20774	Kettle Cuisine, LLC	Green Bay	WI	-88.099	44.528
P2078	Schwab & Company	Oklahoma City	OK	-97.531	35.475
P20783	Mr Wok Foods Inc. dba Maxfield Foods	Las Vegas	NV	-115.095	36.074
P20788	Primal Custom Cutting LLC	South Amboy	NJ	-74.293	40.478
P2079	America's Second Harvest of the Big Bend	Tallahassee	FL	-84.326	30.401
P20790	Carso's Pasta Company	Lynnwood	WA	-122.308	47.81
P20795	Koch Foods	Fairfield	OH	-84.486	39.334
P20795C	Koch Foods	Fairfield	OH	-84.489	39.337
P208	George's Processing, Inc.	Springdale	AR	-94.14	36.198
P2080	Lulu Asian Kitchen	Oakland	CA	-122.162	37.756
P2081	Jr Produce and Food Service Inc.	El Paso	TX	-106.406	31.764
P20815	Buckhead Meat & Seafood Mid-Atlantic, Inc.	Landover	MD	-76.901	38.916
P20818	Hanover Foods Corporation	Centre Hall	PA	-77.662	40.838
P20826	Griggstown Quail Farm	Princeton	NJ	-74.602	40.444
P2083	Mountain West Food Group LLC	Heyburn	ID	-113.764	42.55
P20838	Portillo's Hot Dogs, LLC.DBA Portillo's Food Service, LLC.	Aurora	IL	-88.229	41.737
P20842	Siskiyou Distributing	Yreka	CA	-122.596	41.732
P20845	Crystal Lake Foods, LLC	York	NE	-97.596	40.873
P20852	Kwik Trip, Inc.	La Crosse	WI	-91.226	43.854
P20856	Eureka Locker, Inc.	Eureka	IL	-89.271	40.705
P20860	Southern Meat Processing	Headland	AL	-85.344	31.325
P20862	Olympic Gold Meats, Inc.	Long Beach	CA	-118.199	33.786
P20865	Michael Foods Egg Product Company Pilot Plant R&D	Gaylord	MN	-94.197	44.557
P2088	Sadler's Smokehouse, LLC	Henderson	TX	-94.826	32.163
P20887	Crescent Foods	Chicago	IL	-87.733	41.813
P20889	Crown I Foods, Inc.	Bay Shore	NY	-73.229	40.735
P2089	Blue Moon Specialty Foods	Spartanburg	SC	-81.931	34.957
P20891	Alaska Meat Packers Incorporated	Palmer	AK	-149.116	61.586
P20892	Delta Meat & Sausage Co.	Delta Junction	AK	-145.5	63.971
P20894	Mike's Quality Meats Inc.	Eagle River	AK	-149.57	61.33
P20898	Alaska Commercial Co.	Anchorage	AK	-149.876	61.152
P20899	C&J Tendermeat Co., Inc.	Anchorage	AK	-149.878	61.173
P20900	B&G Meats Inc.	Anchorage	AK	-149.864	61.153
P20902	Teddy's Tasty Meats, Inc.	Anchorage	AK	-149.888	61.165
P20910	Nylund Food, Inc.	Crystal Falls	MI	-88.325	46.097
P20913	A & A Halal Distributors	Orlando	FL	-81.293	28.559
P20917A	Behrmann Meat and Processing #2	Albers	IL	-89.612	38.533
P2092	Tam Bien Wholesale Corp.	Santa Ana	CA	-117.902	33.765
P20923	Foster Poultry Farms, LLC	Porterville	CA	-119.007	36.079
P20926	Buckhead Meat Northeast	Edison	NJ	-74.339	40.513
P20935	Michigan Turkey Producers Co-op, Inc.	Wyoming	MI	-85.717	42.93
P20935A	Michigan Turkey Producers Co-op, Inc.	Grand Rapids	MI	-85.695	42.941
P20946	Raandom Corp.	Covina	CA	-117.876	34.093
P20949	Corn Maiden Foods, Inc.	Harbor City	CA	-118.3	33.804
P2095	Nealey's Foods, Inc.	Chicago	IL	-87.726	41.832
P20957	ROMA SAUSAGE, INC.	UTICA	NY	-75.194	43.091
P20958	Lee Kum Kee (USA) Foods Inc.	City of Industry	CA	-117.981	34.03
P20968	Nor-Am Cold Storage	Le Mars	IA	-96.188	42.768
P20968A	Nor-Am Logistics, Inc.	Schuyler	NE	-97.099	41.451
P20968B	Nor-Am Cold Storage, Inc.	Le Mars	IA	-96.179	42.787
P20978	Boar's Head Provisions Co., Inc.	Holland	MI	-86.097	42.802
P20981	Riverside Meats	Trenton	NC	-77.345	35.062
P20985	Texas Twist	Carrollton	TX	-96.877	32.955
P20999	La Boucherie, Inc.	Spring	TX	-95.49	30.045
P20AE	Lopez Foods, Inc.	Oklahoma City	OK	-97.683	35.472
P21	Pilgrim's Pride Corporation	Moorefield	WV	-78.97	39.059
P210	Foster Poultry Farms, LLC	Turlock	CA	-120.847	37.484
P21006	Karlsburger Foods, Inc.	Monticello	MN	-93.824	45.304
P21006A	Karlsburger Foods, Inc.	Maple Lake	MN	-94.004	45.234
P2101	Tyson Deli, Inc.	Concordia	MO	-93.564	38.968
P21010	Spartanburg Meat Processing Co., Inc.	Spartanburg	SC	-82.007	34.946
P21012	Lapid Food Inc	Covina	CA	-117.887	34.091
P21016	Major Products Co.	North Las Vegas	NV	-115.085	36.242
P21022	Frank Corriher's Beef & Sausage, Inc.	China Grove	NC	-80.58	35.543
P21024	HBC Holdings, LLC	Sioux City	IA	-96.376	42.426
P2105	Schmitz Diversified Corporation	San Leandro	CA	-122.193	37.723
P21054	Herman Falter Packing Company	Columbus	OH	-83.007	39.941
P21059	Americold Logistics, LLC	Chillicothe	MO	-93.537	39.778
P2106	Buckhead Meat Midwest Inc.	Northwood	OH	-83.527	41.604
P21061A	Damn Good Foods Inc.	Stillwater	NY	-73.636	42.954
P2107	The XCJ Corp.	Monterey Park	CA	-118.162	34.047
P21086	Phayvanh Food Corporation	Dallas	TX	-96.889	32.69
P2109	Cibus Corp.	Visalia	CA	-119.387	36.345
P21094	La Guadalupana	Chicago	IL	-87.713	41.809
P211	Palmetto Pigeon Plant, Inc.	Sumter	SC	-80.356	33.935
P21103	US Foods Inc.	Birmingham	AL	-86.818	33.523
P21112	Eastern Treats Speciality Food	Orlando	FL	-81.369	28.476
P21115	General Mills Operations, Inc.	Golden Valley	MN	-93.393	44.994
P21125	Bryan's Meat Cutting, Inc.	Milan	PA	-76.642	41.862
P21134	Willamette Valley Meat Co.	Portland	OR	-122.657	45.525
P21136	Alpha Omega LLC	Madison	WI	-89.311	43.091
P21141	Steidinger Meat Processing	Fairbury	IL	-88.51	40.747
P21141A	Steidinger Foods	Fairbury	IL	-88.509	40.747
P2115	Taste Africa, LLC	Bakersfield	CA	-118.979	35.397
P21156	Den's Country Meats, Inc.	Table Rock	NE	-96.091	40.179
P21159	Steak Master Inc.	Elwood	NE	-99.868	40.594
P21169	Midway Meats	Winston-Salem	NC	-80.191	35.935
P2117	Night Hawk Frozen Foods, Inc.	Buda	TX	-97.834	30.089
P21171	Cargill Meat Solutions	Fort Worth	TX	-97.293	32.767
P21171A	Smithfield Packaged Meats Corp.	Nashville	TN	-86.756	36.115
P21174	Alef Sausage	Mundelein	IL	-87.982	42.251
P21177	Perdue Foods, LLC Replenishment Center	Prince George	VA	-77.311	37.197
P2118	Ruthven Meat Processing Inc.	Ruthven	IA	-94.897	43.131
P21180	Roots Meat Market LLC	Fremont	OH	-83.186	41.374
P21183	New England Meat Packing, LLC	Stafford Springs	CT	-72.288	41.968
P21187	Shaffer Vension Farms, Inc.	Herndon	PA	-76.841	40.69
P21188	Slagel Slaughter	Forrest	IL	-88.41	40.75
P21196	Southern Hens, Inc.	Moselle	MS	-89.306	31.526
P21200	VF America, LLC	Statham	GA	-83.592	33.96
P21202	Halsey Food Service	Madison	AL	-86.74	34.693
P21207	Lorentz Etc. Inc.	Cannon Falls	MN	-92.911	44.538
P2121	Smithfield Packaged Meats Corp.	Arnold	PA	-79.769	40.584
P21214	Pasha USA LLC	Bayonne	NJ	-74.121	40.66
P21217	Hacienda Central, Inc.	Juncos	PR	-65.914	18.174
P21217A	Procesadora La Hacienda, Inc.	San Lorenzo	PR	-65.96	18.184
P2121A	Smithfield Packaged Meats Corp.	Cumming	GA	-84.151	34.192
P2122	Smithfield Packaged Meats Corp.	Wichita	KS	-97.382	37.652
P21230	Fearless Innovation Food Company, LLC	New Albany	IN	-85.825	38.343
P21234	Perdue Foods LLC	Perry	GA	-83.628	32.443
P21237	Joe's Beef Jerky	Statesville	NC	-80.95	35.733
P21254	William & Co., Inc.	Boston	MA	-71.066	42.33
P21255	IQM Interfood Inc.	Hammonton	NJ	-74.811	39.634
P2126	Double-D Group	Greenville	KY	-87.219	37.225
P21265	Smucker's Meats	Mt. Joy	PA	-76.507	40.089
P21269	Bobby Salazar's Food Products, Inc.	Fowler	CA	-119.653	36.603
P21275	D&D Foods Inc.	Omaha	NE	-95.984	41.346
P21276	Tyson Fresh Meats, Inc.	Madison	NE	-97.468	41.818
P2128	John Soules Foods Inc.	Tyler	TX	-95.278	32.411
P21282	Quintero's Meat Co. Inc.	El Paso	TX	-106.438	31.776
P21282A	Garcia's Meat Company, LLC	El Paso	TX	-106.358	31.796
P21284A	M.G. Trading Inc.	Saddle Brook	NJ	-74.1	40.894
P21285	Harvest House Farms	Johnson City	TX	-98.411	30.281
P21293	Bern Meat Plant	Bern	KS	-95.971	39.963
P213	Leon's Fine Foods	McKinney	TX	-96.626	33.223
P2130	Cooper Farms Processing	St. Henry	OH	-84.622	40.426
P21307	Broadleaf Inc.	Vernon	CA	-118.237	33.991
P21309	Belmont Sausage Company	Elk Grove Village	IL	-87.948	42.006
P21309A	Belmont Sausage No. 3	Bensenville	IL	-87.955	41.978
P2131	Dakota Tom Sandwiches, Inc	Corsica	SD	-98.407	43.424
P2132	AdvancePierre Foods, Inc.	Cincinnati	OH	-84.463	39.308
P21328	Lineage Logistics LLC	Milwaukee	WI	-88.051	43.192
P21332	Werling and Sons, Inc.	Burkettsville	OH	-84.644	40.348
P21334	Rainbow Organic Farms Co.	Uniontown	KS	-94.977	37.847
P21335	Wurst Works	Manor	TX	-97.558	30.252
P21340	National Custom Pkg., Inc.	Castroville	CA	-121.743	36.757
P21342	Wan Rong Trading Corp., DBA Taihe Trading Corp.	Long Island City	NY	-73.934	40.74
P21350	White Castle System, Inc.	Zanesville	OH	-81.887	39.941
P21356	La Buona Pasta	Hialeah	FL	-80.318	25.851
P21357	Elaboraciones Fiesta	Aguada	PR	-67.143	18.35
P21371	Yants Snack Foods LLC	Jackson Center	OH	-84.041	40.445
P21372	Mason Brothers Company	Wadena	MN	-95.128	46.443
P21377	Cargill Kitchen Solutions, Inc	Mason CIty	IA	-93.232	43.136
P2139	Glier's Meats, Inc	Covington	KY	-84.518	39.077
P21393	Champion Gourmet Products	San Gabriel	CA	-118.103	34.098
P21397	Tyson Prepared Foods, Inc.	Waterloo	IA	-92.263	42.508
P214	A G Specialty Foods	Happy Valley	OR	-122.488	45.413
P2140	U.S. Foods, Inc.	Chesterfield	MO	-90.605	38.664
P21418	GB Green Gastronome, LLC	Queens Village	NY	-73.734	40.719
P21424A	Twin Marquis, LLC	Brooklyn	NY	-73.939	40.708
P21425	New S & N Meat Market, Inc	Brooklyn	NY	-74.022	40.647
P21430	Bert Posess Inc	Paterson	NJ	-74.145	40.936
P21433	LATIN AMERICA MEATS AND FOODS CORP	Miami	FL	-80.328	25.836
P21436	Champ Meatball Company Inc.	Whittier	CA	-118.052	33.961
P21442	Kased Brothers' Halal Meats	Summit	MS	-90.586	31.281
P21444	Uli's Famous Sausage LLC	Seattle	WA	-122.311	47.595
P21445	Parayil Foods USA, LLC	Jersey City	NJ	-74.071	40.741
P21465B	Water Lilies Food, LLC	Bayshore	NY	-73.263	40.766
P21467	United Source One, Inc.	Belcamp	MD	-76.23	39.476
P21468A	S. E. Meats Inc	Birmingham	AL	-86.854	33.44
P21469	The Lamb Cooperative, Inc.	Compton	CA	-118.221	33.85
P21480B	LandMark Snacks, LLC	Beatrice	NE	-96.744	40.281
P21498	Ozark Mountain Poultry Inc.	Rogers	AR	-94.124	36.347
P215	Butterfield Foods Company	Butterfield	MN	-94.793	43.958
P21510	RRT Distributors Coporation	Trujillo Alto	PR	-66.007	18.349
P21523	Morski Brands, Inc.	Portage	WI	-89.494	43.562
P21529	Heinkel's Packing Company, Inc.	Decatur	IL	-88.929	39.863
P21539	Cooper's Country Meat Packers	Florence	MS	-90.107	32.147
P2154	North Shore Foods LLC	Hopkins	MN	-93.396	44.929
P21544	Lee's Oriental Gourmet Inc.	Shenandoah	PA	-76.201	40.824
P21547	LPB, Inc.	Earlham	IA	-94.125	41.491
P21549	Ashland Sausage Company	Carol Stream	IL	-88.129	41.897
P21550	Webermans	Miami	FL	-80.189	25.83
P21551	Cheese Pleasers Inc.	Bancroft	WI	-89.521	44.309
P21554	Grizzly's Custom Cutting Inc.	Hunt	NY	-78.029	42.543
P21556	San Guiseppe Salami Co. by Giacomo	Elon	NC	-79.508	36.161
P21558	El Greg Inc.	Chicago	IL	-87.73	41.991
P21572	Robert Winner Sons Inc.	Yorkshire	OH	-84.488	40.34
P21577	Southside Market & Barbeque	Elgin	TX	-97.386	30.35
P21585	Kiowa Locker System, LLC	Kiowa	KS	-98.486	37.016
P21585A	Kiowa Locker System	Kiowa	KS	-98.486	37.017
P2159	Rob-Dav Distributors Inc.	Allentown	NJ	-74.609	40.173
P21594	Apostolic Christian HarvestCall	Sterling	OH	-81.793	40.916
P21595	Mayar's Halal Meat Processing	Livingston	CA	-120.726	37.408
P2160	Pride of Iowa	Grinnell	IA	-92.747	41.745
P21600	Inland Market Premium Foods	Tucker	GA	-84.254	33.83
P21600B	Inland Market Premium Foods - RTE Division	Stone Mountain	GA	-84.186	33.831
P21601	Vitale Meats Poultry & Provisions LLC	Columbus	OH	-82.955	39.925
P21611	EUROSTYLE DELI, INC	Skokie	IL	-87.75	42.026
P21614	Chaparro's Tamales	West Haven	UT	-112.029	41.212
P21615	Cooper's Old Time Pit Bar-B-Que, Inc	Llano	TX	-98.681	30.759
P21621	Americold Logistics LLC	Benson	NC	-78.515	35.414
P21627	Webb Properties, LLC	Payneville	KY	-86.329	38.014
P21634	Double R Brand Foods, LLC	Brenham	TX	-96.58	30.186
P21634A	Double R Brand Foods, LLC	Lufkin	TX	-94.718	31.374
P21648	Asianic Inc.	Oak Park	IL	-87.78	41.88
P2166	Carl Streit & Son Co.	Neptune	NJ	-74.022	40.203
P21660	Lechi Food Corporation	LaPorte	TX	-95.067	29.652
P21666	Sunleaf Farms	Mesa	WA	-119.026	46.574
P2167	Groezinger Provisions, Inc.	Neptune	NJ	-74.022	40.204
P21670	Meyers Sausage Co, Inc	Elgin	TX	-97.368	30.341
P21695	R. Whittingham & Sons	Alsip	IL	-87.723	41.662
P21699	Molokai Livestock Cooperative	Ho'olehua	HI	-157.085	21.154
P217	Vanee Foods Company	Berkeley	IL	-87.904	41.893
P2170	Salchert's Market, Inc	Saint Cloud	WI	-88.166	43.824
P21701	Alena Foods, Inc.	Fresno	CA	-119.781	36.726
P21709	Ciales Poultry, Inc.	Chicago	IL	-87.682	41.917
P2171	DiPaola Turkeys Inc.	Trenton	NJ	-74.665	40.247
P21710	Harczak Sausage	Chicago	IL	-87.804	41.98
P21711	Mama Russo's	Ishpeming	MI	-87.714	46.488
P21712	Glatt Boy's Inc.	Bronx	NY	-73.872	40.807
P21716	Tyson Prepared Foods, Inc.	Council Bluffs	IA	-95.89	41.243
P21725	888 Food Company	South El Monte	CA	-118.061	34.053
P21725A	GP Food Company	Temple City	CA	-118.057	34.086
P21725B	888 Food Company	Temple City	CA	-118.058	34.087
P2173	Hinck Turkey Farm Inc	Neptune	NJ	-74.097	40.194
P21734	Joseph Epstein Foods Inc.	East Rutherford	NJ	-74.093	40.82
P21743	Alfresco Pasta, LLC	Bells	TN	-89.09	35.739
P21747	Flowers Slaughter House	Sims	NC	-78.035	35.743
P21750	Lao Thai Nam Corp	Dallas	TX	-96.894	32.719
P21763	Gardners BBQ	Rocky Mount	NC	-77.797	35.974
P21765	Performance Food Group	Temple	TX	-97.347	31.143
P2177	Tom's Slaughter House	Montreal	MO	-92.667	38.045
P2178	PERDUE FOODS LLC	Georgetown	DE	-75.381	38.698
P21780	Burt's Meat & Poultry	Eyota	MN	-92.229	43.988
P21782	Nixon Family Restaurant, Inc.	Edenton	NC	-76.712	36.2
P2179	CHICAGO BUTCHER SHOPS, INC	LAKE FOREST	IL	-87.898	42.276
P21790	Embutidos Vallecrespo	Hatillo	PR	-66.798	18.414
P21794	Taylor Farms Illinois, Inc	Chicago	IL	-87.688	41.885
P21797	Zook's Homemade Chicken Pies, LLC	Paradise	PA	-76.085	40.002
P21798	South Mountain Farms	Lawndale	NC	-81.522	35.461
P218	Pilgrim's Pride Corporation	Lufkin	TX	-94.754	31.335
P2180	Riley Family Farms dba Southern Heritage Foods	Holly Springs	MS	-89.361	34.729
P21802A	Brother and Sister Food Services Inc.	Camp Hill	PA	-76.924	40.232
P2181	Scratch Made Awesomeness, LP	Harrisburg	PA	-76.85	40.247
P21816	Meat Masters, Inc.	Decatur	GA	-84.281	33.731
P21837	Contessa Premium Foods	Vernon	CA	-118.208	33.988
P21838	Bachoco OK Foods	Albertville	AL	-86.179	34.253
P2184	Contender Meat Purveyors, LLC	Hialeah	FL	-80.347	25.897
P21847	Jennette Brothers, Inc.	Elizabeth City	NC	-76.218	36.302
P21848	Wayne Mays Meat Processing	Taylorsville	NC	-81.166	35.922
P21854	Cattaneo BBQ Service	San Luis Obispo	CA	-120.616	35.209
P21855	Productos La Hortaliza	Anasco	PR	-67.143	18.296
P2186	GEORGE'S FOODS, LLC	HARRISONBURG	VA	-78.869	38.456
P21861	Flores Brothers Inc.	Bell Gardens	CA	-118.148	33.961
P21863A	Rio Grande Pak Foods	McAllen	TX	-98.275	26.159
P21869	Out of the Shell, LLC.	South El Monte	CA	-118.058	34.048
P21869A	Out of the Shell LLC.	Pomona	CA	-117.752	34.093
P2187	Chickentown Poultry Services LLC	Pamplin	VA	-78.697	37.183
P21874	Rosemead Processing Meats, Inc.	South El Monte	CA	-118.067	34.057
P21882	S&S Gilardi, Inc.	Mount Vernon	OH	-82.482	40.369
P21888	Fiore Meats LLC	Buckhannon	WV	-80.235	38.969
P21894	Pacific Coast Fruit	Portland	OR	-122.664	45.524
P219	Mediterranean Fine Foods	New Bedford	MA	-70.922	41.622
P2190	Mei Mei	Boston	MA	-71.056	42.336
P21902	Onofrio's Fresh Cut Inc.	New Haven	CT	-72.898	41.295
P21905	Ortega's Meat Distribution	Fresno	CA	-119.819	36.717
P2191	Stearns Poultry Farm	Alfred Station	NY	-77.776	42.267
P21924	Marketplace Deli Products Inc.	Phoenix	AZ	-112.097	33.437
P21929	ALMI Group, Inc.	Philadelphia	PA	-75.124	40.033
P21930I	Fresh Mark Cold Storage	Massillon	OH	-81.492	40.786
P21934A	Lineage Logistics PFS, LLC	Wilmington	CA	-118.252	33.788
P21938	EcoFriendly Foods	Moneta	VA	-79.594	37.215
P2194	Pat's Pastured	East Greenwich Road	RI	-71.508	41.608
P2199	Omni Custom Meats, Inc.	Bowling Green	KY	-86.401	36.925
P22000	Prestage Foods, Inc.	St Pauls	NC	-78.899	34.799
P2201	Webers Quality Meats	San Leandro	CA	-122.185	37.719
P2202	Wonder Group, Inc.	Cranford	NJ	-74.283	40.644
P22022	National Meat & Provisions, LLC	Reserve	LA	-90.566	30.064
P22042	Illini Institutional Foods, Inc.	Rantoul	IL	-88.178	40.309
P22048	T.K.O.	Cedar Lake	IN	-87.461	41.375
P22052	Corfini Meat and Seafood	Chula Vista	CA	-117.058	32.593
P22054	Premier Foods	Phoenix	AZ	-112.096	33.456
P22057	Godo's Restaurant & Oriental Mart	Houston	TX	-95.401	29.698
P22061	NuVue Foods	Hamtramck	MI	-83.045	42.393
P22069	Glory's Bakery	Virginia Beach	VA	-76.145	36.856
P22070	New York Meat, Inc.	Bronx	NY	-73.872	40.807
P22076	Buckhead Meat Midwest Inc	Hampshire	IL	-88.505	42.134
P22080	International Meat Co.	Chicago	IL	-87.803	41.923
P22084	Wisdom Natural Poultry	Haxtun	CO	-102.728	40.453
P22094A	Del Real, LLC	Mira Loma	CA	-117.525	34.031
P22095	Creston Valley Meats	Creston	CA	-120.455	35.461
P22097	Holifield Farms, Inc.	Covington	GA	-83.915	33.563
P22102	Valley Fine Foods Company, Inc.	Benicia	CA	-122.128	38.071
P22102A	Valley Fine Foods Company, Inc.	Yuba City	CA	-121.612	39.111
P22104	Nital Trading Co Inc	Hialeah	FL	-80.372	25.927
P2211	FREED, LLC	Tyler	TX	-95.274	32.35
P2212	Meatco Inc.	Oakland	CA	-122.276	37.802
P2213A	Buckhead Meat of San Antonio	San Antonio	TX	-98.412	29.44
P2213D	Buckhead Meat Dallas a Sysco Company	Dallas	TX	-96.889	32.685
P2225	Blueridge processing Corp	Marion	NC	-81.952	35.651
P2227	Hatcher Poultry & Egg Co.	Wichita Falls	TX	-98.5	33.925
P2228	VM LA Sultana Products Corp	Middel Village	NY	-73.876	40.708
P2229	SFC Global Supply Chain, Inc.	Salina	KS	-97.632	38.784
P223	Hormel Foods Corporation	Austin	MN	-92.967	43.677
P2233	Shirley's Dream Inc.	Albuquerque	NM	-106.68	35.029
P2235	Despieces La Ceba, LLC	Catano	PR	-66.149	18.43
P2241	Silsa Miami Corp.	Miami	FL	-80.233	25.796
P2242	Three Rivers Meat Company	Smithville	OK	-94.675	34.509
P2243	YODERS BUTCHER BARN	grantsville	MD	-79.097	39.701
P2248	Wei Ming USA, Inc.	Maspeth	NY	-73.916	40.718
P2254	Continental Foods	Chicago	IL	-87.664	41.777
P2257	Stallings Head Cheese Co.	Houston	TX	-95.416	29.734
P2259	Olive & Finch Comm, LLC	Denver	CO	-104.924	39.679
P2260E	AdvancePierre Foods, Inc.	Enid	OK	-97.807	36.417
P2260T	Gold Creek Foods, LLC	Caryville	TN	-84.21	36.315
P2260Y	AdvancePierre Foods, Inc.	Enid	OK	-97.799	36.396
P2261	Robertson's Hams, Inc.	Marietta	OK	-97.13	33.942
P2264	Tamales Del Valle	Salem	OR	-123.028	44.971
P2267	D6 Processing LLC	iron Station	NC	-81.085	35.439
P2268	LSG Sky Chefs	Charlotte	NC	-80.925	35.2
P2269	Tyson Refrigerated Processed Meats, Inc.	Vernon	TX	-99.293	34.162
P2270	Two Creek Farms LLC	Union Grove	WI	-88.057	42.681
P2274	Lone Star Meats Ltd.	Austin	TX	-97.725	30.214
P2276	Fresh & Ready Foods LLC	Renton	WA	-122.243	47.474
P2279	Frutarom USA, Inc.	Corona	CA	-117.554	33.883
P2281	Pimento's Foods Inc.	El Paso	TX	-106.454	31.774
P2289	Tyson Prepared Foods, Inc.	N. Richland Hills	TX	-97.245	32.852
P2292	Ouray Meat and Cheese Market	Ouray	CO	-107.672	38.025
P2294	Hans Kissle	Dallas	NC	-81.226	35.31
P2295	Jedediah Aspen, LLC	Carbondale	CO	-107.089	39.392
P2295A	Jedediah Corporation	Jackson	WY	-110.795	43.461
P2296	Primo Smokehouse & Kitchen, LLC	Ballinger	TX	-99.96	31.735
P2298	Deen Meat and Cooked Foods, Inc.	Fort Worth	TX	-97.338	32.779
P230	Boyle's Famous Corned Beef (2024), LLC	Kansas City	MO	-94.606	39.102
P2300	Fresh Texas LLC	Austin	TX	-97.672	30.276
P2304	FreshPoint Central Florida	Orlando	FL	-81.41	28.438
P2307	Paxos Foods, LLC	Allentown	PA	-75.447	40.628
P2311	Malu's Foods Corp	Atlanta	GA	-84.265	33.886
P2312	E.A. Sween Company	Hodges	SC	-82.222	34.324
P2318	Louisa Food Products, Inc.	St Louis	MO	-90.254	38.717
P2320	L & C Meat Co., Inc.	Independence	MO	-94.366	39.093
P2321	Long Hollow Cattle Company	Bloomsburg	PA	-76.416	41.035
P2327	Iowa Pacific Processors, Inc.	Des Moines	IA	-93.653	41.565
P2334	Oberle Meats	St. Genevieve	MO	-90.065	37.959
P2335	Win-A-Nell Butchering and Meats, LLC	New Oxford	PA	-77.113	39.848
P2338	Keith Valley Packing Company	Dallas	TX	-96.859	32.768
P2347	House of Solomon, LLC	Brooklyn	NY	-73.97	40.68
P235	Washington Beef, LLC	Toppenish	WA	-120.332	46.373
P2356	HEB Fresh Plant	San Antonio	TX	-98.361	29.413
P2357	Amana Meat Shop & Smokehouse	Amana	IA	-91.869	41.802
P2358	Abuela's Foods Company	Riviera Beach	FL	-80.066	26.778
P2359	IHMAC Prepared Foods	Hollywood	FL	-80.204	26.01
P236	Texas Tech University, Gordon W. Davis Meat Science Laboratory	Lubbock	TX	-101.888	33.583
P2360	Empresa Ebenezer Inc.	Ciales	PR	-66.467	18.353
P2364	Lauretta Jean's	Portland	OR	-122.654	45.518
P2365	Performance Food Group, Inc.	Berkley	MO	-90.325	38.726
P2366	Ben-Lee Processing Inc.	Atwood	KS	-101.046	39.831
P2372	DRR Processing LLC	Burton	TX	-96.525	30.209
P2375	Serenade Foods, Division of Maple Leaf Farms, Inc.	Milford	IN	-85.808	41.366
P2376	Top Salgados by Sandra Carvalho	Longwood	FL	-81.346	28.689
P2377	Johnsons Sausage Shoppe	Rio	WI	-89.246	43.445
P2378	Stevison Ham Company	Portland	TN	-86.528	36.591
P2379	Backroad Meats Inc.	Milaca	MN	-93.641	45.789
P2382	Direct Source Meats-Albuquerque	Albuquerque	NM	-106.716	35.081
P2383	Clear Water Meats	Eau Claire	MI	-86.301	42.01
P2386	Saba Poultry 3 Corp	Sacramento	CA	-121.385	38.516
P2389	Famous Natchitoches LA Meat Pie Co.	Coushatta	LA	-93.343	32.028
P2390	Negril, Inc.	Linthicum	MD	-76.655	39.226
P2399	Whiskey Ridge	Radisson	WI	-91.212	45.773
P2401	Konanyan Meat Company, Inc. / Western Gourmet	Los Angeles	CA	-118.267	34.135
P2403	Colorado Premium Foods	Greeley	CO	-104.719	40.389
P2404	R and D Meats	Jennings	OK	-96.57	36.181
P2405	Link Snacks Inc	Mankato	MN	-93.993	44.184
P2409	Velmar Foods	Phoenix	AZ	-112.141	33.493
P2412	Humpty's Food Group	Sharon Hill	PA	-75.262	39.901
P242	Schiltz Foods, Inc.	Sisseton	SD	-97.051	45.665
P2420	Cher-Make Sausage Company	Manitowoc	WI	-87.685	44.085
P2421	BUREK ETC LLC	Wyoming	MI	-85.649	42.904
P2422	Old Wisconsin Sausage Co. Inc.	Sheboygan	WI	-87.738	43.731
P2422B	Old Wisconsin Sausage, Inc.	Sheboygan	WI	-87.764	43.703
P2426B	Milwaukee Craft Meats, LLC., d/b/a Klement's Sausage Company	Milwaukee	WI	-87.911	42.997
P2427	Chisholm Trail Meats, LLC	Enid	OK	-97.802	36.415
P2428	Sir Delicious	Rochester	NY	-77.576	43.176
P2429	Harvest Foods, LLC	Holtwood	PA	-76.295	39.846
P243	Tyson Foods, Inc.	Cumming	GA	-84.143	34.206
P2430	CSS Caribbean Meal LLC	Newnan	GA	-84.8	33.45
P2434	Buckhorn Meat Co.	Esparto	CA	-122.014	38.688
P2435	The Hillshire Brands Company	New London	WI	-88.734	44.372
P2436	Fajita Haus Meat Processors LLC	McAllen	TX	-98.258	26.207
P2437	Benson + Turner Foods, Inc.	Waubun	MN	-95.933	47.189
P2439	Old Salt Meat Company DBA Ranchland Packing	Butte	MT	-112.552	45.997
P244	Plainville Farms	New Oxford	PA	-77.057	39.859
P2446	Formosa Food Company Inc.	Hull	IA	-96.136	43.185
P2447	Sandridge Food Corporation	Medina	OH	-81.903	41.138
P244C	Tyson Fresh Meats, Inc.	Council Bluffs	IA	-95.888	41.242
P244G	Tyson Fresh Meats, Inc.	Goodlettsville	TN	-86.711	36.331
P244S	Tyson Fresh Meats, Inc.	Sherman	TX	-96.605	33.581
P244U	Tyson Fresh Meats, Inc	Eagle Mountain	UT	-112.076	40.303
P2450	Daily's Premium Meats	Missoula	MT	-114.036	46.884
P2451	E.A. Sween Company	Eden Prairie	MN	-93.481	44.861
P2457	Chawdhury Farm and Meat Processing	Sterling Township	PA	-75.412	41.366
P2458	Bakalars Sausage Co., Inc.	La Crosse	WI	-91.222	43.862
P2459	Delicacy Meats, LLC	Honey Brook	PA	-75.831	40.094
P24601	Ready Alliance Group, Inc	Salt Lake City	UT	-111.991	40.746
P2461	Nestle USA, Inc.	Medford	WI	-90.341	45.123
P2462	Ethnic Food Concepts, LLC	Olathe	KS	-94.805	38.848
P2465	Yummy Yum Food	Los Angeles	CA	-118.261	33.974
P2468	Sweet Kaki's, LLC	Newnan	GA	-84.994	33.387
P2469	The Meat Market Inc.	Fresno	CA	-119.801	36.845
P247	Sanderson Farms, Inc. (Processing Div)	Hazlehurst	MS	-90.38	31.877
P2472	Jack Link's Beef Jerky	Minong	WI	-91.83	46.091
P2475	Roundman's Smokehouse	Fort Bragg	CA	-123.806	39.446
P2478	Fortune Wisconsin LLC	Windsor	WI	-89.335	43.2
P248	SOPAKCO Packaging	Bennettsville	SC	-79.683	34.612
P2480	Jarrett Foods	Canon	GA	-83.104	34.403
P2481	Nilssen's Market	Clear Lake	WI	-92.271	45.255
P2482	P3 Custom Meats LLC	Dunlap	TN	-85.288	35.507
P2485	De la Montana LLC	Twin Lakes	WI	-88.247	42.535
P2487	Fresh Healthy Habits	Gardena	CA	-118.269	33.897
P2489	The Doner Factory	Arcadia	CA	-118.008	34.102
P248D	TDF Inspection and Processing	Madelia	MN	-94.418	44.054
P2490	QUICK FOOD WRAPS L.L.C.	MADISON HEIGHTS	MI	-83.111	42.512
P2491	Lowcountry Food Bank	Early Branch	SC	-80.962	32.721
P2492	Ye Olde Butcher Shoppe	Rochester	MN	-92.476	44.031
P2494	Pies of London	Elk Grove Village	IL	-88.026	41.993
P2498	Silver Creek Specialty Meats Inc.	Oshkosh	WI	-88.538	43.986
P2503	Muleshoe Meat Processing	Muleshoe	TX	-102.725	34.223
P2504	OSI Industries, LLC	Chicago	IL	-87.653	41.811
P2505	9 Star Foods, Inc.	Wilmington	CA	-118.249	33.782
P2508	The Bruss Company	Chicago	IL	-87.738	41.946
P2509	Pioneer Wholesale Meat	Chicago	IL	-87.685	41.885
P2510	Best Choice Meats	Alsip	IL	-87.717	41.663
P2512	Monogram Frozen Foods	Bristol	IN	-85.81	41.716
P2515	W & G Marketing	Jewell	IA	-93.65	42.31
P2516	Carl Buddig and Company	Montgomery	IL	-88.369	41.741
P2518	AMPC, LLC	Dalton	GA	-84.985	34.665
P252	Boston Lamb and Veal	Boston	MA	-71.068	42.331
P2522	Alsleben Meats, LLC.	Glencoe	MN	-94.151	44.771
P2525	King Food Service, Inc.	Rock Island	IL	-90.627	41.443
P2535	Land O' Frost	Munster	IN	-87.513	41.529
P2539B	Great Kitchens Food Company, INC	Romeoville	IL	-88.107	41.613
P2540	KBDetroit, LLC	Detroit	MI	-83.036	42.348
P2541	Total Packaging of Kentucky, INC.	Owensboro	KY	-87.12	37.724
P2543	TK America Inc.	Ontario	CA	-117.562	34.063
P2544	WCD Kitchen - Irving	Irving	TX	-97.022	32.819
P2551	Q'Delicia LLC	Jacksonville	FL	-81.56	30.275
P2553	West Coast Dumpling Company	Sedro-Woolley	WA	-122.237	48.503
P2554	VIE Meats	Vancouver	WA	-122.636	45.655
P2557	Almena Meat Company, Incorporated	Almena	WI	-92.039	45.41
P2559	Academy Packing Co Inc	Dearborn	MI	-83.151	42.308
P2560	Whalens Meat Packing LLC	Mott	ND	-102.308	46.371
P2561	Elsie Mae Sweet Shop LLC	Lake Mills	WI	-88.893	43.072
P2562	Burnett Dairy Cooperative	Grantsburg	WI	-92.7	45.773
P2563	Papa Banh Bao	Tukwila	WA	-122.248	47.45
P2564	Smithfield Packaged Meats Corp.	Cincinnati	OH	-84.457	39.285
P2570	LIC COM, LLC	bronx	NY	-73.888	40.811
P2572	Prime Fish LLC	Santa Monica	CA	-118.474	34.024
P2574A	Wolverine Packing Company	Detroit	MI	-83.043	42.346
P2574B	Wolverine Packing Co.	Detroit	MI	-83.041	42.346
P2574C	Wolverine Packing Company	Detroit	MI	-83.043	42.348
P2574D	Wolverine Packing Company	Detroit	MI	-83.043	42.358
P2575	E123 Enterprises, LLC	Bronx	NY	-73.872	40.807
P2576	Pepe's Operating, LLC	Chicago	IL	-87.66	41.861
P2585	Link Snacks, Inc.	New Glarus	WI	-89.628	42.821
P2588	Byler's Custom Meats	Clarkson	KY	-86.106	37.386
P2591	Branding Iron Holdings - Holten Meat	Sauget	IL	-90.149	38.578
P2592	Byron Center Wholesale Meats, Inc.	Byron Center	MI	-85.725	42.813
P2595	David's Premium Beef LLC	N Little Rock	AR	-92.247	34.767
P2597	Arch Food Service Inc.	Wheeling	IL	-87.925	42.11
P2598	Hudson Meat Company	Columbus	OH	-82.988	39.914
P259B	Pikalo Foods, LLC	New Haven	CT	-72.912	41.308
P260	Nestle Professional North America	Trenton	MO	-93.61	40.08
P2600	Rode's Meats, LLC	Delphos	OH	-84.318	40.853
P2601	Martinous Produce Company Inc.	Pittsburg	KS	-94.741	37.443
P2603	Quail International Inc.	Greensboro	GA	-83.152	33.571
P261	The Hillshire Brands Company	Zeeland	MI	-86.027	42.919
P2611	Arveybell Farm Co.	Middlesboro	KY	-83.714	36.62
P2612	J. W. TREUTH & SONS, INC.	Catonsville	MD	-76.776	39.272
P2614	Jordan's Meat Market	Marcus	IA	-95.796	42.809
P2615	Chandler Foods, Inc.	Greensboro	NC	-79.838	36.056
P2617	Gold Creek Foods, LLC	Gainesville	GA	-83.818	34.268
P2621	Asahi Union LLC	Frasier	MI	-82.96	42.55
P2629	Hobson Foods Service	Nashville	TN	-86.893	36.18
P263	Jones Dairy Farm	Fort Atkinson	WI	-88.846	42.92
P2632	Pilgrim's Pride Corporation	Live Oak	FL	-83.157	30.373
P2635	Unidos Meat Processors LLC	Hidalgo	TX	-98.26	26.127
P263A	Jones Dairy Farm	Fort Atkinson	WI	-88.85	42.916
P2640	Moin Halal Meat, LLC	Harrisburg	PA	-76.89	40.284
P2642	H.B. Taylor Co.	Chicago	IL	-87.708	41.805
P2643	Latin Bites Factory LLC	Doral	FL	-80.342	25.797
P2644	Chef Dad Pot Pies	Baltimore	MD	-76.593	39.307
P2647	Keystone Catering, LLC	Kinzers	PA	-76.047	40.012
P265	RALPH & PAUL ADAMS, INC.	BRIDGEVILLE	DE	-75.606	38.742
P2651	Icebox Pantry, LLC	Hallandale Beach	FL	-80.146	25.989
P2658	Diana Food Company	Silverton	OR	-122.773	45.02
P2660	Saucefly Basecamp	Eugene	OR	-123.161	44.045
P2664	Northwest Arkansas Food Bank	Lowell	AR	-94.127	36.274
P2669	Merindorf Meats Inc	Mason	MI	-84.435	42.524
P2670	New Kingsport Provision Company, Inc.	Kingsport	TN	-82.553	36.542
P2671	United Foods International (USA) Inc.	Phoenix	AZ	-112.203	33.441
P2673	Heartquist Hollow Farm, LLC	Dudleyville	AZ	-110.739	32.92
P2676	Southeast Poultry, Inc.	Rogers	AR	-94.147	36.352
P2678	Malcolms Meat Service Inc	Bristol	VA	-82.202	36.604
P2679	P.S.Thai LLC	Melbourne	FL	-80.621	28.115
P2686	Keystone Foods, LLC	Camilla	GA	-84.182	31.279
P2690	Flock Foods, LLC	Santa Fe Springs	CA	-118.052	33.94
P2696	Cuatro Cinco Manufacturing	Houston	TX	-95.404	29.837
P2697	Buckhead Beef	College park	GA	-84.46	33.633
P26C	JBS Prepared Foods	Council Bluffs	IA	-95.895	41.244
P27	Tyson Foods, Inc.	Grannis	AR	-94.335	34.241
P2702	Pizzacini CORP	Miami	FL	-80.241	25.795
P2705	United Meat Products, Inc.	Bellport	NY	-72.947	40.799
P2706	Cup and Char Pepperoni, Inc.	Buffalo	NY	-78.812	42.877
P2713	J. Rago Veal Co.	Boston	MA	-71.067	42.331
P2717	Atlanta Community Food Bank	East Point	GA	-84.495	33.663
P2718	Shawarma Al Basha, LLC	Miami	FL	-80.202	25.766
P272	T. F. Kinnealey Co., Inc.	Brockton	MA	-71.066	42.051
P27216	Great American Trucking- Select Foods	Delray Beach	FL	-80.092	26.45
P27219	North State Provision	Ahoskie	NC	-76.984	36.288
P27221	Standard Meat Company	Dallas	TX	-96.913	32.696
P27226	Second Harvest Food Bank of Middle Tennessee, Inc.	Nashville	TN	-86.794	36.199
P27232	Smithfield Fresh Meats Corp.	Tar Heel	NC	-78.803	34.747
P27237	Gore's Processing, Inc.	Edinburg	VA	-78.62	38.803
P27240	Old Hickory Smokehouse	Lewisburg	TN	-86.866	35.453
P2725	Croquetas La Mary LLC	Pembroke Park	FL	-80.169	25.995
P27256A	Carlie C. McLamb Meats	Dunn	NC	-78.622	35.319
P27257	Central KY Custom Meats, Inc.	Liberty	KY	-85.061	37.372
P2726	Lo Fuk Yuen By Dim Sum Shop, Inc.	Brooklyn	NY	-73.999	40.617
P27263	Mr. Mudbug, Inc.	Kenner	LA	-90.27	30.0
P2727	Home Market Foods, Inc.	Norwood	MA	-71.19	42.169
P27273A	Felbro Culinary Specialties	Compton	CA	-118.226	33.879
P27274	P&S Bakery, Inc	Youngstown	OH	-80.704	41.126
P27277	Noxwell International, Inc.	Chamblee	GA	-84.294	33.894
P27288	DuBonilha Sausage Company	Newark	NJ	-74.172	40.746
P27289	Los Cidrines.	Arecibo	PR	-66.745	18.459
P27291	Urumex, LLC	Norcross	GA	-84.198	33.913
P27293	Miiller's Llano Smokehouse and Mercantile	Llano	TX	-98.684	30.76
P27295	D-S Smith Grinding Division Inc	North Salt Lake City	UT	-111.912	40.855
P27296	Bum Foods LLC	Birmingham	AL	-86.765	33.569
P27297	Campo Lindo Farms	Lathrop	MO	-94.368	39.509
P273	The Spotted Trotter. LLC	Atlanta	GA	-84.35	33.747
P27302	San Francisco Soup Company	Oakland	CA	-122.241	37.781
P27316	Good Food Concepts, LLC	Colorado Springs	CO	-104.742	38.838
P2732	The Cut Meat Market	Sanborn	IA	-95.64	43.184
P27333	Nestle Prepared Foods Company	Jonesboro	AR	-90.581	35.82
P2734	El Porteno Inc.	Oakland	CA	-122.24	37.786
P27342	Melotte Distributing, Inc.	Green Bay	WI	-87.991	44.509
P27349	Toluca Mexican Style Food Products, LLC	Baltimore	MD	-76.622	39.291
P2735	Ninos Fine Foods inc.	San Francisco	CA	-122.391	37.723
P27353	Best Chicago Meat Company, LLC	Chicago	IL	-87.743	41.916
P27361	Reliable Brothers	Green Island	NY	-73.692	42.756
P27372	Truzzolino Tamales	Butte	MT	-112.513	45.995
P27373	The Classic Jerky Company	Taylor	MI	-83.247	42.262
P27379	Altura LLC	Anchorage	AK	-149.869	61.182
P2738	NHM Packing LLC	Florence	TX	-97.893	30.817
P27383	Paloma Mexican Foods Corporation	Santa Fe Springs	CA	-118.043	33.917
P27384	Smithfield Packaged Meats Corp.	Sioux Center	IA	-96.171	43.093
P27388	Second Bite Foods Inc	Shakopee	MN	-93.466	44.793
P27389	Pitman Farms	Sanger	CA	-119.552	36.693
P27398	Berkshire Refrigerated Warehousing LLC	Chicago	IL	-87.659	41.811
P27409	Artisan Bread Co., LLC	Warren	MI	-83.076	42.478
P27412	CSC FOOD MANUFACTURING, LLC	Graham	NC	-79.391	36.059
P27418	Granna's LLC	Bessie	OK	-98.988	35.389
P27424	Crider, Inc.	Stillmore	GA	-82.214	32.429
P27426	Fischer's Meat Market, Inc.	Muenster	TX	-97.376	33.651
P27426B	Fischer's Production Center	Muenster	TX	-97.375	33.651
P2743	Maria Empanada Commissary	Broomfield	CO	-105.1	39.905
P27434	Jim's Meat Market of Iron River LLC	Iron River	WI	-91.404	46.569
P27435	The Cut Custom Processing, LLC	Rosebush	MI	-84.773	43.684
P27446	Ajinomoto Health & Nutrition North America	Akron	OH	-81.488	41.096
P27462	BRK Meats, LLC	Carthage	TX	-94.36	32.159
P27467	A.J.'s Lena Maid Meats, Inc.	Lena	IL	-89.829	42.381
P27468	Buckhead Meat and Seafood of Central Florida	Auburndale	FL	-81.778	28.072
P2748	Quaker Maid Meats Inc.	Reading	PA	-75.929	40.315
P27483	EME LLC	Mundelein	IL	-87.99	42.251
P27486A	Curly's Custom Meats	Jackson Center	OH	-84.049	40.44
P27488	Mekong Fresh Meats, Inc.	Mosinee	WI	-89.668	44.743
P27488A	Mekong Fresh Meats, Inc.	Mosinee	WI	-89.669	44.788
P2748A	Quaker Maid Meats	Reading	PA	-75.925	40.314
P2749	Modern Market Wholesale, LLC	Orchard Park	NY	-78.788	42.788
P27490	Mi Ranchito Foods, Inc.	Bayard	NM	-108.134	32.759
P27493	Central Oregon Butcher Boys	Prineville	OR	-120.867	44.324
P27497	Ready Pac Produce, Inc.	Irwindale	CA	-117.938	34.094
P27499	Wenneman Meat Company, Inc.	St. Libory	IL	-89.712	38.364
P27505	Gold Creek Processing, LLC	Dawsonville	GA	-84.107	34.424
P27505A	Gold Creek Processing, LLC	Gainesville	GA	-83.792	34.328
P27510	ATM International USA Inc.	Torrance	CA	-118.343	33.816
P2756	Fresh Creative Cuisine	baltimore	MD	-76.539	39.27
P276	AdvancePierre Foods, Inc.	Portland	ME	-70.278	43.645
P2769	Omaha Beef Company Inc.	Danbury	CT	-73.452	41.398
P276A	AdvancePierre Foods, Inc	Portland	ME	-70.304	43.707
P2770	Wagner Provision Co., Inc.	Gibbstown	NJ	-75.276	39.826
P2771	Doña Tina	Irvine	CA	-117.847	33.681
P2778	Along Came Tamale	Fate	TX	-96.381	32.942
P2780	MAI'S Foods, LLC	Sorento	IL	-89.513	39.005
P2784	Epic Food Bites, LLC	Norristown	PA	-75.344	40.114
P2788	Brocks Butcher Block	Sparta	WI	-90.841	44.108
P2793	5 Pillars Meat LLC	Farmville	VA	-78.411	37.264
P2794	Chop Chop Inc	Federal Way	WA	-122.314	47.302
P2796	Lamoy Meat Market Corp.	Brooklyn	NY	-74.005	40.652
P2799	Fidemart Food LLC	Tampa	FL	-82.489	27.957
P28	Smithfield Packaged Meats Corp.	Cudahy	WI	-87.864	42.954
P2800	Superior Farms	Dixon	CA	-121.822	38.417
P2801	PNW Veg Co LLC	Salem	OR	-122.957	45.055
P2802	Magong Food LLC	Monterey Park	CA	-118.151	34.053
P2813	IF Co-Pack, LLC DBA Initiative Foods LLC	Sanger	CA	-119.549	36.69
P2813A	IF Co-Pack, LLC DBA Initiative Foods	Sanger	CA	-119.549	36.69
P2824	Overhill Farms, Inc.	Vernon	CA	-118.214	34.004
P2825	Blue Mountain Meats, Inc.	Monticello	UT	-109.339	37.868
P2826	Just In Thyme Foods	Memphis	TN	-89.849	35.191
P2829	Good Chaan	SANTA CLARA	CA	-121.982	37.372
P2834	NO BULL Prime Meats Production Facility	Albuquerque	NM	-106.59	35.145
P2839	Cherokee Locker Inc.	Cherokee	IA	-95.551	42.731
P2840A	Golden Gate Wine Country Meats	Santa Rosa	CA	-122.714	38.427
P2840B	Golden Gate Meat Company	Richmond	CA	-122.362	37.922
P2842	Pimax	Berkeley	CA	-122.287	37.854
P2846	Far West Meats	San Bernadino	CA	-117.256	34.121
P2847	Revival Gourmet Foods, LLC	Downingtown	PA	-75.693	40.005
P2851	Reser's Fine Foods, Inc.	Hillsboro	OR	-122.911	45.565
P2852	Sara Sausage	Palmer Lake	CO	-104.906	39.126
P2853	Cattaneo Bros, Inc.	San Luis Obispo	CA	-120.653	35.267
P2854	Rudolph Foods Company Inc.	Beaumont	CA	-116.998	33.927
P2855	Co-Man of GA Foods	Cumming	GA	-84.11	34.228
P286	Perdue Foods LLC	Washington	IN	-87.206	38.655
P2861	Safety Fresh Foods, LLC.	Glendale	WI	-87.916	43.096
P2862A	Oberto Snacks Inc.	Kent	WA	-122.268	47.4
P2862C	Oberto Snacks Inc.	Kent	WA	-122.268	47.4
P2865	Oscar's Meats	Ogden	UT	-111.983	41.209
P2866	Knockout Butchery	Roebuck	SC	-81.917	34.762
P2867	Portesi Italian Foods Inc.	Stevens Point	WI	-89.514	44.505
P287	Gaspar's Sausage Co., Inc.	N. Dartmouth	MA	-70.992	41.665
P2870	Im'peccable Chicken LLC	Commerce	CA	-118.156	34.015
P2872	Newport Meat Northern California, Inc.	Fremont	CA	-121.916	37.465
P2874	Allen Brothers, LLC	Richmond	CA	-122.374	37.926
P2875	Sabor Brasil, LLC	Windsor Locks	CT	-72.626	41.918
P2877	Haros Food Distribution, Inc.	Oxnard	CA	-119.163	34.189
P2879	Pearson Foods Corporation	Grand Rapids	MI	-85.64	42.907
P2881	Champion Foods, LLC	Gaffney	SC	-81.691	35.078
P2882	Perdue Foods LLC	Petaluma	CA	-122.601	38.233
P2888	Demes Gourmet Corporation	Fullerton	CA	-117.89	33.873
P289	Schiff's Food Service, Inc., DBA R&R Provision Company	Easton	PA	-75.228	40.69
P2891	Dolores Canning Co., Inc.	Los Angeles	CA	-118.176	34.049
P2894	House of Raeford Vienna	Vienna	GA	-83.768	32.097
P2896	Daniel Western Meat Packers Inc.	Pico Rivera	CA	-118.096	34.003
P29	Cargill Meat Solutions	Albert Lea	MN	-93.356	43.626
P2901	Bernatello's Pizza, Inc.	Maple Lake	MN	-94.014	45.234
P2902	Cougle Commission Company	Chicago	IL	-87.666	41.843
P2904	Spring Grove Foods Inc.	Miamisburg	OH	-84.287	39.638
P2908	Quick Pick Express	Oakland	CA	-122.308	37.816
P2910	Superior Foods Company	Kentwood	MI	-85.569	42.886
P2910A	Superior Foods Company	Kentwood	MI	-85.559	42.877
P2925	Family Farms, LLC	Eau Claire	WI	-91.527	44.779
P2928	American Jerky Company LLC	Ontario	CA	-117.6	34.04
P2929	Western Smokehouse	Greentop	MO	-92.564	40.354
P293	Cedar Creek Beef Jerky L.L.C.	El dorado Springs	MO	-94.005	37.854
P2932	Gotham Gourmet Provisions LLC	East Hanover	NJ	-74.4	40.803
P2933	Syracuse Food Group, LLC	Ponder	TX	-97.288	33.188
P2938	Woods Smoked Meats, Inc.	Bowling Green	MO	-91.21	39.348
P2941	Planit Eats, Inc.	Fairhaven	MA	-70.897	41.646
P2942	Roncadin Inc.	Vernon Hills	IL	-87.956	42.23
P2944	Fajoli & Fajoli Service LLC	Deerfield Beach	FL	-80.126	26.317
P2945	EL FIRULETE EMPANADAS LLC.	Waukegan	IL	-87.846	42.356
P2949	Frick's Quality Meats	Washington	MO	-91.055	38.571
P2951	SMGP Holdings, LLC	Macon	GA	-83.7	32.869
P2956	Nadler's Meats & Catering LLC	Wellington	MO	-93.999	39.133
P2957B	Surlean Meat Company	San Antonio	TX	-98.514	29.413
P2958	El Rey Meat Company	St. Louis	MO	-90.226	38.698
P2960	Soul Brothers Meats, LLC	North Wales	PA	-75.277	40.216
P2962	Mrs. Gerry's Kitchen	Albert Lea	MN	-93.348	43.675
P2966	National Beef Packing Food Service	Kansas City	KS	-94.617	39.085
P2967	Kuna Food Service	Dupo	IL	-90.194	38.524
P2968	AG Masterpiece	Los Angeles	CA	-118.206	34.067
P2969	Swiss Processing Plant Inc.	Hermann	MO	-91.47	38.562
P2972	Northeast Regional Corrections Center	Saginaw	MN	-92.33	46.917
P2974	Metabolic Meals, LLC	St. Louis	MO	-90.285	38.479
P2975	Meadville Locker LLC	Chillcothe	MO	-93.55	39.787
P2980	LG Foods LLC	El Paso	TX	-106.197	31.68
P2985	Elstner Meat Processing LLC	Weimar	TX	-96.81	29.703
P2990	St. Croix Meats, LLC	Chicago	IL	-87.714	41.797
P2991	De Leon Foods	Spokane Valley	WA	-117.195	47.656
P2FR	ConAgra Product Development Lab	Omaha	NE	-95.926	41.255
P3	Mountaire Farms, Inc.	Millsboro	DE	-75.26	38.6
P300	Maple Leaf Farms, Inc.	Milford	IN	-85.805	41.366
P3006	Corn Maiden Foods	Baldwin Park	CA	-117.975	34.104
P3007	HOFC, LLC	Sherwood	OR	-122.831	45.364
P3009	Los Altos Poultry Inc.	Paramount	CA	-118.186	33.891
P3017	Janus Food Group, Inc.	Northumberland	PA	-76.82	40.901
P3019	Whitsons Food Service (Bronx), LLC.	Berkeley	IL	-87.899	41.89
P3024	Papis Cuban Grill Commissary	Atlanta	GA	-84.266	33.886
P3026	D & S Meats Inc.	Mokena	IL	-87.861	41.544
P3029	Productos Nieves	San Antonio	PR	-67.087	18.493
P3041	Greenridge Naturals, Inc	Elk Grove Village	IL	-87.951	41.998
P3044	Kenco Foods, LLC	Bath	PA	-75.393	40.727
P3048	Padovani LLC	Los Angeles	CA	-118.344	34.033
P3050	KettleWorks, LLC	Neffsville	PA	-76.241	40.056
P3054A	Mystic Cafe	Lewiston	ID	-117.015	46.419
P3068	Sunset Farms LLC	Gilmer	TX	-94.791	32.664
P3071	Lot 279, LLC	Norfolk	NE	-97.413	42.011
P3075	Hanford Quality Meats LLC	Tracy	CA	-121.429	37.768
P3076	Kingdom Farms	Chicago	IL	-87.685	41.885
P3077	Sal Vitales and Sons Pizza Factory LLC	Muscatine	IA	-91.045	41.422
P30775	Rose Meat Services	Vernon	CA	-118.197	34.001
P30778	Rosemead processing Meats, Inc.	Los Angeles	CA	-118.254	34.025
P308	Koch Foods of Mississippi	Morton	MS	-89.655	32.355
P3082	Wholesale Produce Supply, LLC	Minneapolis	MN	-93.217	44.992
P3083	Talisman Foods Inc	Salt Lake City	UT	-111.893	40.723
P30833	Vazquez Foods Inc.	Commerce	CA	-118.131	34.001
P3085	Village Protein, Inc.	Monroe	WA	-122.003	47.868
P3088	Chefsolutions Manufacturing LLC	Orlando	FL	-81.274	28.467
P309	Garden Fresh Beef Jerky, Inc.	Garden Grove	CA	-117.946	33.774
P3092	Mac's Cajun Company	St. Amant	LA	-90.802	30.221
P30959	Emuna Inc	Hawthorne	CA	-118.334	33.914
P3096	Supreme Dumplings	Redmond	WA	-122.137	47.683
P3097	Café Rio Inc.	West Valley City	UT	-111.984	40.721
P3098	Earth Life Foods LLC	INDIANAPOLIS	IN	-85.954	39.773
P31	Fresh Mark Massillon	Massillon	OH	-81.499	40.784
P3103	Southern Complete Processing, LLC	Eunice	LA	-92.333	30.504
P3103A	Riceland Crawfish, Inc.	Eunice	LA	-92.414	30.494
P3103C	Doug Guillory Farm, LLC	Eunice	LA	-92.414	30.495
P3115	Gangnam Gourmet Food LLC	Chicago	IL	-87.662	41.89
P3119	SKs SmoKeHouse	Sims	IL	-88.516	38.418
P3120	E.W. Grobbels Sons, Inc.	Taylor	MI	-83.298	42.25
P3129	Capital Management HPP, Inc.	Bartow	FL	-81.86	27.895
P3133	Georgia Packing Co., LLC	Americus	GA	-84.196	32.116
P3133B	Georgia Packing LLC	Columbus	GA	-84.946	32.453
P3134	Fresh Acre Foods	Gainesville	GA	-83.763	34.253
P3135	All In Meat LLC	Groveland	FL	-81.805	28.568
P31354	Grand Prairie Foods, Inc.	Sioux Falls	SD	-96.691	43.563
P31354N	Grand Prairie Foods, Inc.	Sioux Falls	SD	-96.749	43.567
P3145	World of Pies LLC	Norcross	GA	-84.21	33.936
P3151	Centrillium Holdings LLC	Midwest City	OK	-97.402	35.508
P31532	Tonali's Meats, LLC	Denver	CO	-104.931	39.771
P31536	A La Carte Foods Properties, LLC.	Belle Rose	LA	-91.092	30.042
P31541	Alexandra Foods, LLC	Chicago	IL	-87.767	41.941
P31552	Smithfield Distribution, LLC	Crete	NE	-96.958	40.624
P31561	Maple Ridge Meats LLC	Benson	VT	-73.312	43.676
P31566	Monogram Gourmet Foods	Willmington	MA	-71.164	42.601
P31566A	Monogram Foods	Wilmington	MA	-71.161	42.6
P31575	Munsey Meats	Morristown	TN	-83.313	36.258
P31578	Trenton Processing	Trenton	IL	-89.684	38.605
P31586	Village Green Foods	Irvine	CA	-117.85	33.694
P31592	Streb Meats, Inc.	Dalton	OH	-81.692	40.796
P31593	Green Bay Dressed Beef, LLC	Green Bay	WI	-88.013	44.528
P316	Nestle Professional	Cleveland	OH	-81.698	41.476
P31606	Brock's Esto Meat Processing	Bonifay	FL	-85.646	30.978
P31624	Kerry Ingredients & Flavours Inc.	Vesper	WI	-89.966	44.484
P31636	Dobber's Pasties, Inc.	Escanaba	MI	-87.078	45.756
P31638	Chicharrones J&J	Santa Ana	CA	-117.852	33.743
P31639	Mountain Meadow Productions	Los Angeles	CA	-118.244	34.015
P31647	Theurers Custom Meat Inc	Lewiston	UT	-111.878	41.976
P3165	Red Rock Foods	Braselton	GA	-83.785	34.096
P31652	On On Food Company	Oakland	CA	-122.255	37.795
P31654	Burrito Kitchens Enterprises	Longmont	CO	-105.042	40.164
P31663	US Foods, Inc.	Lexington	NC	-80.326	35.777
P3167	A TU GUSTO LLC	Lehigh Acres	FL	-81.597	26.62
P31679	South Florida Foods International, Inc.	Miami	FL	-80.356	25.828
P31681	Ankeny Cold Storage, LLC	Ankeny	IA	-93.594	41.716
P31690	Quality Refrigerated Services, Inc.	Spencer	IA	-95.149	43.16
P31697	TKMM, LLC	Portland	OR	-122.579	45.546
P31699	S&F Foods Inc.	Romulus	MI	-83.33	42.26
P31725	Nana's Kitchen, Inc	Johnsburg	IL	-88.222	42.37
P31725H	Nana's Kitchen, Inc.	Huntley	IL	-88.418	42.169
P31727	Kiryas Joel Poultry Processing Plant	Monroe	NY	-74.159	41.336
P31731	Herd Packing Company LLC	Springfield	IL	-89.639	39.843
P31744	Skoglund Meats and Locker, Inc.	West Bend	IA	-94.442	42.961
P3175	True Pack, LLC.	Evansville	IN	-87.545	38.006
P31750A	Nuovo Pasta Productions, Ltd.	Stratford	CT	-73.155	41.169
P31750B	Nuovo Pasta Productions, Ltd.	Stratford	CT	-73.155	41.165
P31757	Buckhead Meat of Denver	Aurora	CO	-104.798	39.761
P31763	Land Mark Products Inc.	Milford	IA	-95.173	43.328
P31764	The Global Gourmet, LLC	Shamokin	PA	-76.58	40.832
P31771	FlexXray, LLC	Arlington	TX	-97.079	32.683
P31772	Lone Star Bakery, Inc.	China Grove	TX	-98.33	29.383
P31776	Eickman's Processing Co., Inc.	Seward	IL	-89.357	42.235
P31778	The Kreuz Sausage and Barbecue Co., Inc.	Lockhart	TX	-97.672	29.89
P31780	A & S Distributors	Salida	CA	-121.085	37.709
P31784	John Soules Foods, Inc.	Gainesville	GA	-83.834	34.276
P31786	Very Tasty LLC	Miami	FL	-80.236	25.797
P31787	BAFS, Inc.	Bangor	ME	-68.807	44.811
P31788	Shinsegae Foods, Inc.	Salem	OR	-123.004	44.989
P31793	Lineage Logistics LLC	Mount Pleasant	IA	-91.522	40.972
P31795	Halal Meat Slaughter House	Norwood	NC	-80.202	35.221
P31805	JBS USA	Olympia	WA	-122.781	47.079
P31806	Enslin & Son Packing Company	Hattiesburg	MS	-89.309	31.364
P31812	Crider, Inc.	Stillmore	GA	-82.214	32.429
P31816	Schad Meats Inc.	Cincinnati	OH	-84.545	39.133
P31820	His Meat Company, LLC	Rudolph	WI	-89.806	44.496
P31820A	His Meat Company	Rudolph	WI	-89.804	44.496
P31824	Bloomfield Food, Inc.	Anaheim	CA	-117.815	33.864
P31826	Wild Zora Foods, LLC	Loveland	CO	-105.056	40.403
P31834	California Sausage Inc.	Santa Ana	CA	-117.897	33.743
P31843	State Farm Meat Plant	State Farm	VA	-77.831	37.641
P31851	Chee Foo International Inc	Phoenix	AZ	-112.151	33.505
P31860	Georgia Department of Corrections	Milledgeville	GA	-83.195	33.01
P31865	Paradise Locker Meats	Trimble	MO	-94.568	39.475
P31866M	Woodson County Prime Meats Pro	Yates Center	KS	-95.741	37.882
P31870	Embutidos El Compay	Coamo	PR	-66.343	18.081
P31877	Twin Rivers Foods	Atkins	AR	-92.931	35.241
P31881	DG Foods, LLC	Hazlehurst	MS	-90.401	31.924
P31884	Pritzlaff Wholesale Meats, LLC	New Berlin	WI	-88.125	42.997
P31888	Gold Star Chili, Inc	Cincinnati	OH	-84.42	39.113
P31896	Universal Pure Cold Storage, LLC & Universal Pure, LLC	Lincoln	NE	-96.699	40.769
P31896AR	Universal Pure Holdings, LLC	Arlington	TX	-97.068	32.746
P31896B	Universal Pure West	Mira Loma	CA	-117.521	34.027
P31896C	Universal Pure, LLC	Meriden	CT	-72.816	41.541
P31896D	Universal Pure, LLC	Delphos	OH	-84.319	40.855
P31896M	Universal Pure, LLC	Malvern	PA	-75.557	40.067
P31896VR	UPC Southeast, LLC	Villa Rica	GA	-84.941	33.748
P31898	Kensington Lockers Inc.	Kensington	KS	-99.034	39.771
P31899	Perdue Foods, LLC	Salisbury	MD	-75.589	38.399
P31903	Gold Kosher Catering	N. Miami Beach	FL	-80.18	25.955
P31907	Diverse Food Products, LLC	Baldwinsville	NY	-76.303	43.169
P31910	Bella Bella Gourmet Foods, LLC	West Haven	CT	-72.982	41.29
P31911	King Cheese Corporation	Monrovia	CA	-117.997	34.134
P31915	MERRILL DISTRIBUTING, INC.	Wausaukee	WI	-87.95	45.369
P3192	Colorado Prefare Foods, LLC	Denver	CO	-104.857	39.784
P31932	Certified Meat Products	Fresno	CA	-119.747	36.698
P31932A	Certified Meat Products	Fresno	CA	-119.748	36.702
P31935	Flying Food Group, LLC	Miami	FL	-80.311	25.79
P31943B	CTI Foods Texas Soups, LLC	Saginaw	TX	-97.355	32.853
P31944	Au Bon Canard Foie Gras, Inc.	Caledonia	MN	-91.409	43.575
P3195	Sunbow Distributing	Orem	UT	-111.683	40.269
P31960	Humphrey's Market, Inc.	Springfield	IL	-89.636	39.782
P31971	D&M Packing	Albemarle	NC	-80.21	35.337
P31979	Gold Creek Processing LLC	Gainesville	GA	-83.827	34.274
P31980	M & C Unico, Inc.	Los Angeles	CA	-118.235	33.976
P31993	Garland Ventures LTD	Garland	TX	-96.674	32.913
P31996	Kaiser Foodline LLC	Garland	TX	-96.687	32.896
P31996B	Kaiser Foodline, LLC	Houston	TX	-95.64	29.706
P31999	Thompson Farms Country Cured Meats	Dixie	GA	-83.701	30.761
P32	Mar-Jac Poultry, Inc.	Gainesville	GA	-83.828	34.279
P320	Sanderson Farms, Inc.	Laurel	MS	-89.16	31.667
P32004	American Pasteurization Company	Milwaukee	WI	-88.052	43.071
P32006	Frozen Assets Cold Storage LLC	Chicago	IL	-87.683	41.844
P32007	Walnut Valley Packing LLC	El Dorado	KS	-96.848	37.81
P32009	Salm Partners, LLC	Denmark	WI	-87.834	44.356
P3201	Maestri d'Italia Inc.	Vineland	NJ	-75.055	39.521
P32015	Troll Smokehouse	Kawkawlin	MI	-83.95	43.667
P32016	CPK Quality Foods	Blaine	MN	-93.23	45.135
P32019	San Miguel	Modesto	CA	-120.992	37.606
P32026	Raw Seafoods, Inc.	Fall River	MA	-71.11	41.74
P32029	Kiolbassa Provision Company Inc.	San Antonio	TX	-98.516	29.413
P32029A	Kiolbassa Provision Company	San Antonio	TX	-98.511	29.41
P3203	Criolite Corporation	Las Piedras	PR	-65.872	18.179
P32031	K-D Market Inc.	New York	NY	-73.999	40.717
P32036	El Corral Meats	Salt Lake City	UT	-111.94	40.759
P32038	By George, Inc.	Trujillo Alto	PR	-65.988	18.374
P32042	Brushy Prairie Packing, Inc.	LaGrange	IN	-85.268	41.647
P32049	Ron's Home Style Foods	Houston	TX	-95.481	29.64
P32053	Fresh Grill LLC	Santa Ana	CA	-117.865	33.708
P32053A	Richandre, Inc.	Carson	CA	-118.252	33.878
P32056	Lao Khitsada Food, Inc.	Whittier	CA	-118.066	33.969
P32062	Washington County Meat Packing	Bristol	VA	-82.213	36.65
P32064	LA PASTA INC	Silver Spring	MD	-77.058	39.002
P32076	Los Olivos, Ltd.	Farmingdale	NY	-73.428	40.725
P32081	Salad Time, LLC	Jackson	GA	-84.048	33.215
P32084	Northern Lakes Seafd & Mts LLC	Detroit	MI	-83.058	42.41
P32085	ASU Food Safety and Product Development Lab	San Angelo	TX	-100.513	31.544
P32095	Wassler Meats, Inc	Cincinnati	OH	-84.625	39.163
P32107	Gourmet Boutique LLC	Phoenix	AZ	-112.107	33.445
P32113	Down Home Meats, Inc	Stonewall	LA	-93.821	32.283
P32119	Blackhawk Specialty Foods	Beaver Falls	PA	-80.391	40.768
P3212	Cuttinup Custom Meat Processing, LLC	Leeton	MO	-93.707	38.62
P32120	Green Mountain Smokehouse, Inc	Windsor	VT	-72.392	43.469
P32123	Custom Culinary, Inc	Avon	OH	-82.006	41.476
P32130	Dakota Provisions LLC	Huron	SD	-98.159	44.367
P32131	Rey Chavez Distributor Corp.	Miami	FL	-80.252	25.83
P32133	Biloxi Beach Group LLC #2	Pelahatchie	MS	-89.816	32.401
P32134	Bridgford Meat Company	Statesville	NC	-80.782	35.75
P32138	HTE Food Corp.	College Point	NY	-73.839	40.784
P32141	Lo Yumhmie Foods, LLC	Appleton	WI	-88.419	44.273
P32143	Otto's Poultry Inc.	Middleville	MI	-85.462	42.737
P32145	Emmaus Foods, LLC	Albertville	AL	-86.216	34.283
P32148	Bak Foods	Atlanta	GA	-84.546	33.754
P32150	The Craft Cannery	Bergen	NY	-77.941	43.071
P32153	Opportunities, Inc. of Jefferson County	Fort Atkinson	WI	-88.832	42.939
P32153A	Opportunities, Inc.	Oconomowoc	WI	-88.478	43.075
P32154	Rico Brand Inc.	Salt Lake City	UT	-111.918	40.768
P32154R	Rico Brand Inc.	Salt Lake City	UT	-111.918	40.768
P32158	The Royal Butcher	Braintree	VT	-72.689	43.932
P32166	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Itasca	IL	-88.047	41.989
P3217	Member's Cut	Sioux Center	IA	-96.173	43.089
P32170	Ganaderos Borges	Naguabo	PR	-65.742	18.212
P32174	Alatrade Foods, Inc.	Albertville	AL	-86.167	34.233
P32182	Sanderson Farms, Inc.	Moultrie	GA	-83.746	31.159
P322	Pilgrim's Pride Corporation	Cold Spring	MN	-94.406	45.462
P3221	Homestyle Direct	Lewisburg	TN	-86.758	35.427
P3230	Sargento Cheese Inc.	Hilbert	WI	-88.163	44.133
P3236	LALM, LLC	Buffalo	NY	-78.831	42.885
P3239	Del Sur Reading	Reading	MA	-71.103	42.522
P3243	WFN Foods LLC	San Antonio	TX	-98.427	29.323
P325	Tyson Foods, Inc.	Center	TX	-94.166	31.793
P3250	Robert Rust Foods	Winston-Salem	NC	-80.221	36.072
P32511	Harvester Meat Co.	Canton	IL	-90.028	40.597
P3252	Joe's Commissary, LLC	San Francisco	CA	-122.388	37.757
P3253	Politis Specialty Foods LLC	Deerfield Beach	FL	-80.125	26.313
P3254	Cedar Valley Services	Austin	MN	-92.98	43.689
P3256	Link Snacks, Inc.	Perry	GA	-83.766	32.487
P3267	Global Food Services, Inc.	Tampa	FL	-82.42	27.966
P3270	Oh Brother Philly NJ	Pennsauken	NJ	-75.074	39.94
P3272	Wilfoods, LLC	Henderson	NC	-78.41	36.319
P3276	New England Charcuterie, LLC	Waltham	MA	-71.2	42.385
P3278	Calbassa	Glendale	CA	-118.285	34.164
P3282	SK Food Group, Inc.	McDonald	TN	-84.967	35.139
P3290	Cozy Corner Cooking	Rutledge	MO	-91.994	40.253
P3293	E.W. Grobbel Sons, Inc.	St. Clair Shores	MI	-82.908	42.474
P3298	AM Food Manufacturing & Distribution, LLC	Meriden	CT	-72.765	41.502
P3299	Papa Charlie's	Chicago	IL	-87.735	41.857
P33	Performance Food Group	Taunton	MA	-71.137	41.944
P3301	Little Brown Bird LLC	Pennsauken	NJ	-75.077	39.93
P3302	Cluck Ya Poultry	Gardiner	ME	-69.833	44.165
P3326	Americold Logistics, LLC	Jefferson	WI	-88.812	42.99
P332T	FPL Food, LLC	Thomasville	GA	-84.005	30.842
P3330	El Maguey Dorado Corporation	Hialeah	FL	-80.286	25.844
P334	A.J. Sons, Inc.	Laguna Beach	CA	-117.764	33.564
P3340	Founders Meat Co.LLC	Tucker	GA	-84.239	33.839
P3343	SoupWerks	Ontario	CA	-117.568	34.049
P3346	GoOats, LLC	Alexandria	VA	-77.137	38.803
P3349	Harvest Station Foods, LLC	Loudon	TN	-84.414	35.713
P3352	JX Foods LLC	Las Vegas	NV	-115.185	36.075
P3353	Straka Meats inc.	Plain	WI	-90.046	43.279
P3357	Himalayan Dumplings	Minneapolis	MN	-93.229	44.949
P3360	Omaha Halal Live Market, Inc.	Omaha	NE	-95.951	41.21
P3364	Gold Buckle Meats	Fairdealing	MO	-90.742	36.654
P3367	Arctic Cold Storage	St Cloud	MN	-94.156	45.498
P3369	Diamond Foods	Glen Burnie	MD	-76.63	39.158
P337	Fairmont Foods, Inc.	Fairmont	MN	-94.45	43.657
P3372	Que Arepas Factory LLC	Greenville	SC	-82.324	34.839
P3375	Panna Manufacturing LLC	Miami Gardens	FL	-80.218	25.922
P3377	Vodes Preparedness LLC	Dalbo	MN	-93.409	45.658
P33788	Siberoni	Portland	OR	-122.529	45.501
P33789	United Premium Foods, LLC	Woodbridge	NJ	-74.276	40.543
P33812	Halperns' Purveyors of Steak and Seafood	Atlanta	GA	-84.529	33.626
P33814	Buffalo SAV, Inc.	Buffalo	NY	-78.814	42.885
P33816	GICS Foods, LLC	Greenville	SC	-82.406	34.786
P33823	Hot Tamale Heaven	Greenville	MS	-91.058	33.408
P33824	Southern Snack Foods, Inc	Miami	FL	-80.197	25.945
P33829	Viva Burrito Development Corporation	Tucson	AZ	-110.958	32.214
P33832	Link Snacks, Inc	Laurens	IA	-94.847	42.849
P33840	Vicolo Wholesale	Hayward	CA	-122.052	37.61
P33843	Eagle Bridge Custom Meat and Smokehouse	Eagle Bridge	NY	-73.392	42.961
P33850	Florida Meat Packaging, Inc.	Hialeah	FL	-80.333	25.896
P33861	Standard Meat Company	Saginaw	TX	-97.354	32.855
P33863	Morty Pride Meats, Inc.	Fayetteville	NC	-78.861	35.047
P33866	Firmenich Incorporated	New Ulm	MN	-94.456	44.317
P33871	Ellengee Market Co	Chicago	IL	-87.766	41.973
P33883	Original Fried Pies	Davis	OK	-97.141	34.399
P33884	Zarate Foods Inc.	Modesto	CA	-121.072	37.708
P33885	Wayne Farms LLC	Decatur	AL	-87.05	34.611
P33886	Tyson Bros., Inc.	Gastonia	NC	-81.138	35.279
P3389	Pizza By Pappas	Scranton	PA	-75.662	41.41
P33893A	Fra' Mani, LLC	Berkeley	CA	-122.299	37.88
P3390	Golden Platter Foods, Inc.	Linden	NJ	-74.266	40.621
P33900	Case Farms, Processing	Farmerville	LA	-92.434	32.838
P33901	Case Farms, Processing	Farmerville	LA	-92.434	32.838
P33902	Wing Lee Farms	Chino	CA	-117.701	34.006
P33905	Sun Boricua	Camuy	PR	-66.844	18.379
P33911	Ansaldos Sausage Corp.	Moorpark	CA	-118.893	34.282
P33916	Loris Cold Storage and Retail	Loris	SC	-78.907	34.065
P33928	Lockwood Packing CO, LLC	Lockwood	MO	-93.959	37.388
P33928A	Lockwood Packing CO, LLC	Lockwood	MO	-93.963	37.39
P33936	Spray-Tek Inc.	Middlesex	NJ	-74.5	40.566
P33944	Perdue Foods LLC	Perry	GA	-83.631	32.445
P33945	Stir Foods, LLC	Orange	CA	-117.865	33.814
P33948	Alwan & Sons Meats, Inc.	Peoria Heights	IL	-89.583	40.732
P33954	RHOSEY LLC   Rhosey, LLC	Brooklyn	NY	-73.973	40.612
P33957	Wholesome Products, LLC	Lemont	IL	-88.018	41.701
P33958	Halpern's Steak and Seafood Company LLC	WALTON	KY	-84.604	38.859
P33959	El Popular Sausage Factory, LLC	Valparaiso	IN	-87.017	41.458
P33960	Tyson Processing Services, Inc.	Bowling Green	KY	-86.29	37.037
P33961	D R Kiszka Inc	Linden	NJ	-74.236	40.646
P33967	Rajbhog Foods (NJ), Inc.	Jersey City	NJ	-74.062	40.72
P33973	Cream Co. LLC	Oakland	CA	-122.209	37.759
P33975	Steuben Foods Inc.	Elma	NY	-78.629	42.802
P33976	Northstar Foods, Inc.	Elk Grove Village	IL	-87.943	41.989
P33982	JBB Trading LLC	Houston	TX	-95.231	29.62
P33983	Smithfield Packaged Meats Corp	Sioux City	IA	-96.382	42.484
P33985	Kasia's Deli, Inc.	Chicago	IL	-87.685	41.89
P33987	Red Bowl Food Corporation	Brooklyn	NY	-74.015	40.63
P33989	StoneRidge Wholesale Division LLC	Wautoma	WI	-89.27	44.069
P33989A	Stone Ridge Wholesale Division LLC	Coloma	WI	-89.51	44.041
P33997	Roundy's Supermarkets, Inc.	Kenosha	WI	-87.874	42.591
P3400	Xinca Foods LLC	Arlington	WA	-122.149	48.169
P34001	Percival Packing L.L.C.	Scott City	KS	-100.916	38.483
P34008	Pasty Central LLC	Calumet	MI	-88.423	47.265
P34009	Washington Lamb Inc	Lorton	VA	-77.178	38.74
P3401	Jones Country Meats Inc	Climax	GA	-84.396	30.878
P34013	Taylor Farm - Pacific	Tracy	CA	-121.408	37.75
P34017	Orion Food Systems, LLC	Sioux Falls	SD	-96.765	43.574
P34026	Sunsof, Inc.	Hialeah	FL	-80.263	25.877
P34029	Global Gourmet Food Solutions LLC	Garland	TX	-96.69	32.902
P34037	Select Brands L.L.C.	Springfield	MO	-93.352	37.225
P34038	Sonia's Kitchen	Auburn	WA	-122.228	47.335
P34049	B & K Meat	Decatur	GA	-84.239	33.78
P34054	Fisher's Homestyle Salads LLC	Lancaster	PA	-76.214	40.064
P34056	Olsen Farms Meats	Chewelah	WA	-117.739	48.246
P34062	Teets Meat Packing, LLC	Elkins	WV	-79.819	38.95
P34064	QUALITY FOOD DISTRIBUTOR, INC.	LAS VEGAS	NV	-115.204	36.114
P34069	BHY  Foods Factory, LLC	El Monte	CA	-118.019	34.054
P34077	Roadrunner Home Bake, Inc.	Gladstone	OR	-122.602	45.388
P34078	Great Lakes Poultry, Inc.	La Porte	IN	-86.697	41.532
P34078A	Tri Eagle LLC	Kingsford Heights	IN	-86.698	41.487
P34084	Edmunds Foods	Dahlonega	GA	-83.925	34.484
P34095	A1 Meat Solutions, Inc.	El Monte	CA	-118.013	34.062
P341	Golden Rod Broilers	Cullman	AL	-86.768	34.151
P34103	Gentle Harvest	Winchester	VA	-78.137	39.286
P34107	American Food Services, LLC	Morganton	NC	-81.621	35.729
P34107A	American Food Service	Valdese	NC	-81.566	35.745
P34117	Atlanta Meat Company, Inc.	Norcross	GA	-84.204	33.947
P34118	American Copackers Inc.	Alexandria	VA	-77.075	38.843
P34119	Apache Foods LLC	Canutillo	TX	-106.601	31.915
P3412	Redemption Acres LLC	Lucedale	MS	-88.521	30.908
P34126	Latin Flavors Enterprise Inc.	Opa Locka	FL	-80.277	25.894
P34133	Royal Provisions, LLC	Dawson	MN	-96.024	44.924
P34135	Frenchy's Sausage Co., Inc.	Houston	TX	-95.45	29.841
P34138	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Carol Stream	IL	-88.109	41.923
P34140	Americold Logistics, LLC	Darien	WI	-88.731	42.592
P34142	The Perfect Pita, Inc.	Springfield	VA	-77.204	38.743
P34145	Kadejan, Inc.	Glenwood	MN	-95.372	45.656
P34148	Club House Market, Inc	Oklahoma City	OK	-97.53	35.462
P34151	George's Brand Meats, LLC	Franklin Park	IL	-87.906	41.945
P34153	Hooks Distribution USA, LLC	Bennettsville	SC	-79.641	34.624
P3416	FIT N PREP LLC	Groveland	FL	-81.805	28.569
P34167	Dakota Packing	Las Vegas	NV	-115.198	36.105
P34174	Pacific Coast Meat Inc.	San Francisco	CA	-122.401	37.777
P34176	Swift Beef Company	Lenoir	NC	-81.564	35.882
P34177	Sklenarik's Smoked Meats, Inc.	Miles	TX	-100.182	31.597
P34182	Flushing Meat	Brooklyn	NY	-73.936	40.71
P34183A	USA Canning Food	Santa Ana	CA	-117.902	33.747
P34186	Tsim Neej Oriental	Fresno	CA	-119.737	36.743
P34195	Gourmet Specialty Foods, LLC	North Andover	MA	-71.11	42.659
P34198	Don's Cold Storage & Transportation	Rogers	AR	-94.127	36.35
P34208	MEAT BAR INC.	JAMAICA	NY	-73.783	40.67
P3421	Boreas Freeze Dry LLC	Mount Vernon	MO	-93.828	37.087
P34216	Northwest Premier Meats, LLC	Tualatin	OR	-122.814	45.38
P34221	Glass Onion Catering	Richmond	CA	-122.372	37.93
P34224	Johnsonville, LLC	Sheboygan Falls	WI	-87.907	43.792
P34225	Johnsonville, LLC	Sheboygan Falls	WI	-87.908	43.794
P34227	S.D.J TRADING	Irvington	NJ	-74.249	40.72
P34241	Cortez Food Production	Salinas	CA	-121.631	36.649
P34243	T.G. Meat Center	East Bernard	TX	-96.064	29.532
P34250	Abeles & Heymann, LLC	Hillside	NJ	-74.235	40.709
P34257	Don Novo & Son	Miami	FL	-80.257	25.835
P3426	D'Empanadas	Brooklyn	NY	-73.952	40.643
P34271	Perthaiz, LLC	Hagerman	NM	-104.33	33.121
P34272	Vigil's Beef Jerky	Albuquerque	NM	-106.63	35.167
P34276A	Cabal sausage Co	Fredericksburg	VA	-77.441	38.379
P34283	Custom Meats of Marathon, Inc.	Marathon	WI	-89.843	44.922
P34284	Cruz Best Foods	Yigo	GU	144.885	13.528
P34290	Chef Minute Meals Inc	Piney Flats	TN	-82.28	36.436
P34293	Thrushwood Farms Quality Meats, Inc.	Galesburg	IL	-90.417	40.947
P34293A	Thrushwood Farms Quality Meats, Inc.	Galesburg	IL	-90.4	40.937
P34296	Koch Foods of Mississippi-Morton Prepared	Morton	MS	-89.663	32.314
P34306	Athens Foods, Inc.	Cleveland	OH	-81.787	41.406
P34308	Sanderson Farms, Inc.	Waco	TX	-97.051	31.624
P34311	Paden Cold, Inc.	Norfolk	VA	-76.208	36.842
P34313	Columbus Manufacturing Inc.	Hayward	CA	-122.111	37.624
P34318	SFMV Newco, LLC	Tuscaloosa	AL	-87.551	33.181
P34320	SON AND SONS TRADING CO. INC.	BROOKLYN	NY	-73.931	40.725
P34332	Commissary El Gallo, INC	Lodi	CA	-121.248	38.139
P34349	West Liberty Foods LLC	Tremonton	UT	-112.198	41.72
P34360	House of Halal Meat, Inc	Jasper	FL	-82.931	30.494
P34371	Union Foods LLC	Rocky Mount	NC	-77.79	35.986
P34376	Spectrum Foods, Inc.	Landover	MD	-76.88	38.937
P34380	Mr. Empanada Inc.	Tampa	FL	-82.512	27.992
P34381	Crabill's Retail & Wholesale Meats, LLC	Toms Brook	VA	-78.403	38.943
P34385	Productos Real	El Paso	TX	-106.318	31.728
P34388	European Meat Emporium	Fairfield	CT	-73.232	41.168
P34393	La Terra Fina USA, LLC	Union City	CA	-122.035	37.601
P34401	Hunt's Meat Co.	Waterflow	NM	-108.452	36.76
P34403	Red Rock Beef Jerky	Gallup	NM	-108.748	35.527
P34406	Eagle Rock Food Co	Albuquerque	NM	-106.659	35.099
P34407	Mac's Meat Inc	Las Cruces	NM	-106.802	32.309
P34408	Delicious Beef Jerky	Albuquerque	NM	-106.638	35.158
P34412	Nextwave Food Solutions LLC	Albuquerque	NM	-106.668	35.063
P34414	Lakeside Meats	Carlsbad	NM	-104.226	32.419
P34415	Pronto Express 107	Gallup	NM	-108.79	35.513
P3442	Nurulhuda Trading, Inc.	Bronx	NY	-73.903	40.846
P34420	Tullys Market & Deli	Albuquerque	NM	-106.587	35.092
P34429	Seoul Soondae Inc.	Los Angeles	CA	-118.281	33.915
P34438	Ga Dong Nai	Coupland	TX	-97.445	30.424
P34443	Dave's Seafood Meat & Poultry	Baltimore	MD	-76.654	39.285
P34447	Bar-S Foods	Seminole	OK	-96.661	35.261
P34448	Old World Meat	Duluth	MN	-92.135	46.801
P34449	Texas Natural Meats	Lott	TX	-97.114	31.121
P34459	Wordens Meat	Joplin	MO	-94.42	37.12
P3446	S&E Gourmet Cuts Inc.	Vernon	CA	-118.219	34.009
P34467	Shamrock Food Company	Commerce City	CO	-104.921	39.789
P3446A	S&E Gourmet Cuts Inc.	Vernon	CA	-118.22	34.007
P34473	Dogtown Pizza	St. Louis	MO	-90.229	38.653
P3448	Hebron Partners LLC DBA WOW Food	Margate	FL	-80.197	26.249
P34484	Azoria Food Productions, LLC	Phoenix	AZ	-112.01	33.406
P34485	Fontana Flavors, Inc.	Janesville	WI	-88.995	42.729
P34487	Bourgeois Smokehouse	Thibodaux	LA	-90.844	29.767
P34492	Fuji Food Products, Inc.	Santa Fe Springs	CA	-118.063	33.9
P34493	Salsas Locas	Portland	OR	-122.637	45.49
P34495	J.J. Foodservice Inc.	Vista	CA	-117.204	33.164
P34501	Valley Foods, Inc	Youngstown	OH	-80.645	41.096
P34508	Kam Fung Wong	Brooklyn	NY	-74.009	40.653
P34510	Fiori-Bruna Pasta Products	Hialeah	FL	-80.287	25.921
P34513	Taylor Farms New Jersey, Inc.	Swedesboro	NJ	-75.364	39.763
P34513A	Taylor Farms New Jersey, Inc.	Swedesboro	NJ	-75.366	39.765
P34524	A & A Finest	Corona	NY	-73.863	40.739
P3453	Tiny C Snacks, Inc.	Worcester	MA	-71.772	42.296
P34530	Signature Sauces	Independence	OH	-81.63	41.363
P34538	The Wornick Company dba Baxters North America, Inc.	Cincinnati	OH	-84.451	39.313
P34542	AZ Gourmet Foods Inc.	Philadelphia	PA	-75.128	40.019
P34543	Brewer Meats	North Vernon	IN	-85.676	38.923
P34546	Americold Mullica Hill	Mullica Hill	NJ	-75.256	39.722
P34554	Wilson Farm Meats, Inc.	Elkhorn	WI	-88.544	42.666
P34555	Lineage Logistics PFS, LLC	Jacksonville	FL	-81.687	30.333
P34560	Americold Logistics LLC.	Pedricktown	NJ	-75.411	39.74
P34565	South Superior Foods, Inc.	Superior	WI	-92.105	46.663
P34577	A.T.A. Meat Company, Inc.	Lauderdale Lakes	FL	-80.184	26.16
P34581	Create A Pack Foods, Inc.	Ixonia	WI	-88.599	43.135
P34588	KIWI KUISINE	ALEXANDRIA	VA	-77.112	38.804
P34589	Country Fresh Meats, Inc.	Weston	WI	-89.501	44.89
P3459	Natural Soups, Inc.	Hormigueros	PR	-67.121	18.14
P34590	Chisesi Brothers Meat Packing Co.	New Orleans	LA	-90.182	29.951
P34591	Hastings Foods LLC	Grand Island	NE	-98.38	40.913
P34592	KTF Protein Solutions Inc.	Saint Marys	OH	-84.342	40.53
P34595	Fair Market Inc.	Montgomery City	MO	-91.494	38.96
P34604	Taco Loco Products	Anchorage	AK	-149.894	61.173
P34606	Saugatuck Kitchens, LLC	Stratford	CT	-73.154	41.186
P34614	Stonie's Sausage Shop	Perryville	MO	-89.887	37.722
P34615	Latitude 36 Foods, LLC	Corona	CA	-117.521	33.827
P34626	Alnoor Halal Poultry Market	Brooklyn	NY	-73.994	40.663
P34641	CAFE SPICE LLC	NEW WINDSOR	NY	-74.062	41.489
P34641A	Cafe Spice, LLC	Beacon	NY	-73.947	41.517
P34643A	FiveStar Gourmet Foods	Rancho Cucamonga	CA	-117.581	34.078
P34646	Masala Inc.	Van Nuys	CA	-118.465	34.213
P34650	Eclectic Foods, LLC d/b/a Dirt Road Gourmet	Eclectic	AL	-85.961	32.693
P34657	Rachael's Food Corporation	Chicopee	MA	-72.613	42.166
P3467M	Prem Meats LLC	Spring Green	WI	-90.066	43.188
P3467P	Prem Meats LLC	Prairie du Sac	WI	-89.745	43.293
P34685	Harbor Place Corp.	Stanton	CA	-117.994	33.809
P34687	Northwoods Locker LLC	Clayton	WI	-92.211	45.354
P3469	Volare Food Group, Inc.	Vernon	CA	-118.199	34.003
P34692	Shaker Valley Foods, Inc	Cleveland	OH	-81.734	41.465
P34698	Dover Processing, Inc.	Dover	MN	-92.138	43.969
P3470	Shared Harvest Foodbank	Fairfield	OH	-84.516	39.328
P34703	Taylor Farms	Smyrna	TN	-86.502	35.999
P34707	Taste of Italy	Egg Harbor City	NJ	-74.617	39.536
P34708	Ajinomoto Foods North America	Oakland	MS	-89.906	34.074
P34715	Patterson TMP Operating, LLC	Fort Worth	TX	-97.31	32.624
P34722A	Harvest Food Group, LLC	East Chicago	IN	-87.474	41.623
P34733	Taylor Farms TX, Inc.	Dallas	TX	-96.895	32.752
P34734	Bonneville Meats	Roy	UT	-112.022	41.19
P34736	TFC Poultry, LLC	Ashby	MN	-95.816	46.093
P3474	Americold Logistics	Benson	NC	-78.567	35.358
P34744	Custom Made Meals Jacksonville Buyer, LLC	Jacksonville	FL	-81.659	30.472
P34754	Constance Food Group, DBA Norris Food Services, LLC	Bohemia	NY	-73.091	40.777
P34757	Tortellini & Co. Inc.	Davie	FL	-80.207	26.075
P34763	Rutger University Food Innovation Center	Bridgeton	NJ	-75.222	39.425
P34764	Spokane Produce, Inc.	Spokane	WA	-117.491	47.637
P34771	The Sausage Kitchen	Lisbon Falls	ME	-70.06	43.998
P34774	Progressive Food Products	Tiffin	OH	-83.204	41.103
P34775	Western Meat Processors, Inc.	Mayaguez	PR	-67.151	18.207
P3479	All Hale Meats, LLC	Wolfforth	TX	-102.025	33.506
P34794	Fayette Packing Company, Inc.	Eads	TN	-89.583	35.219
P34795	Summer Garden Food Manufacturing	Boardman	OH	-80.643	40.996
P348	TFC Poultry Winchester, LLC	Winchester	VA	-78.157	39.196
P3480	Crustpz Corp.	Pittsfield	MA	-73.244	42.448
P34800	Hearty Acquisitions, LLC	Brooklyn	NY	-73.938	40.71
P34805	Gold Creek Processing LLC	Gainesville	GA	-83.859	34.27
P34806	PurFoods, LLC	North Jackson	OH	-80.886	41.096
P34811A	Cured by Visconti	Wenatchee	WA	-120.324	47.442
P34816	USA Ham LLC	Hialeah	FL	-80.292	25.847
P34818	Gur-Meat Inc.	Garrochales	PR	-66.583	18.459
P34823	Pacific Coast Container	Seattle	WA	-122.352	47.586
P34825	RFS Cheese, LLC	Monroe	WI	-89.638	42.609
P34826	Alex Deli	Chicago	IL	-87.751	41.931
P34829	Nor-Am Cold Storage, Inc.	Detroit Lakes	MN	-95.839	46.818
P34832	Cured Foods LLC	Avondale Estates	GA	-84.273	33.776
P34834	Taylor Farms Northwest LLC	Kent	WA	-122.233	47.399
P34835	Smithfield Packaged Meats Corp.	Kansas City	MO	-94.673	39.285
P34837	Defiance 326, LLC	Sterling	CO	-103.327	40.711
P34840	Crispheart Produce, Inc.	Hudsonville	MI	-85.866	42.854
P3492	C&J Catering	Middletown	PA	-76.763	40.22
P3493	Meat Planet Inc.	Houston	TX	-95.296	29.742
P3499	Smoking Art	Lexington	SC	-81.173	33.972
P3501	Pope Meat Company LLC	Lockney	TX	-101.445	34.116
P3505	Dakota Gobblers, LLC	Huron	SD	-98.235	44.375
P3506	Tink's Tonic, LLC	Statesboro	GA	-81.819	32.394
P3510	Hong Huong Food Inc.	Garden Grove	CA	-117.922	33.761
P3511	DEDEM HALAL MEAT WHOLESALE INC	Chicago	IL	-87.772	41.917
P3512	Noemi's Dumplings	Nantucket	MA	-70.085	41.267
P3518	Empirical Foods, Inc.	Garden City	KS	-100.829	37.958
P3527	Triple A Farm And Food Processing, Inc.	Reading	PA	-75.872	40.317
P3528	Saker Shoprite Kosher Commisary	Freehold	NJ	-74.24	40.252
P3532	AdvancePierre Foods, Inc.	Claremont	NC	-81.138	35.715
P3534	Romanian Kosher Meats LLC.	Chicago	IL	-87.675	42.013
P3536	Circle E Ranch	Yatesville	GA	-84.162	32.908
P3547	Wald Family Foods LLC	Burlington	IA	-91.159	40.827
P3561	NW Dough LLC	Camas	WA	-122.371	45.586
P3575	Carolina Pure Snacks	Pittsboro	NC	-79.171	35.719
P3577	Furnari Sausage Company	Redding	CA	-122.391	40.582
P3578	Midwest Food and Meat Distributors Inc.	Minnetonka	MN	-93.402	44.903
P3581	Laxson Provisions	New Braunfels	TX	-98.087	29.695
P3587	The Pot Pie Bar	Goffstown	NH	-71.509	42.995
P3591	Hometown Meat Market LLC	Scottsboro	AL	-86.042	34.667
P3592	Milwaukie Kitchen	Milwaukie	OR	-122.635	45.454
P3597	SULU ORGANICS LLC	WEST DUNDEE	IL	-88.348	42.107
P3598	Texas All Grass Fed LLC	Sealy	TX	-96.127	29.768
P3599	Traditional Snack, Inc	Miami	FL	-80.315	25.822
P3603	Amazing Taste Foods, Inc.	North Little Rock	AR	-92.224	34.758
P3605	Chez Gourmet Manufacturers Wholesale Distributors, Inc.	Brooklyn	NY	-73.93	40.645
P3606	Umami Hottie, LLC	San Leandro	CA	-122.172	37.713
P3607	Azuma Foods International Inc., U.S.A	Hayward	CA	-122.135	37.655
P3612	Fatback Pig Project LLC	Birmingham	AL	-86.788	33.517
P3620	Puddin LLC	Capitol Heights	MD	-76.852	38.882
P3622	Neiffer Ranch Poultry LLC	Lexington	OR	-119.708	45.453
P3627	Venture Protein International	Jackson	TN	-88.813	35.62
P3632	Ya YA Foods USA LLC	Ogden	UT	-111.998	41.268
P3639	Nourish Markets Inc.	Wilmington	DE	-75.569	39.732
P3640	Whole Foods Market Connecticut Metro Kitchen	Wallingford	CT	-72.771	41.495
P3643	Loose Goose Kitchenworks	Canaan	NY	-73.429	42.377
P3644	Whole Foods Market Maryland Metro Kitchen	Upper Marlboro	MD	-76.725	38.871
P3645	Mayar Meat	Laton	CA	-119.777	36.466
P3649	Go Time Foods LLC	North Salt Lake City	UT	-111.9	40.861
P3653	Western Smokehouse Partners Mexico, MO	Mexico	MO	-91.833	39.168
P3655	Savoonga Reindeer Commercial Company	Savoonga	AK	-170.494	63.691
P3660	Knidos Group Inc.	Sacramento	CA	-121.447	38.613
P3662	Country Tyme Poultry	Paradise	PA	-76.057	39.959
P3665	La Trafila, LLC	Brooklyn	NY	-73.995	40.668
P3666	Veselka Lorimer Commissary, LLC	Brooklyn	NY	-73.95	40.716
P3683	North Star Bison, Slaughter Division	Conrath	WI	-91.008	45.381
P3685	Norakert INC	Sun Valley	CA	-118.371	34.23
P369	PERDUE FOODS, LLC.	BRIDGEWATER	VA	-78.97	38.389
P3691	Wow Bao LLC	Forest City	NC	-81.841	35.336
P3692	Northstar Bison LLC	Cameron	WI	-91.737	45.412
P3695	Foraged Melon LLC	Chicago	IL	-87.772	41.917
P3697	GroveFoods	Bethel	CT	-73.42	41.358
P3699	Hydro Pressure & Pack LLC	Twinsburg	OH	-81.466	41.291
P3705	HM Halal Munchies Corp.	Syosset	NY	-73.516	40.802
P3709	Sunflame Foods LLC	Healdsburg	CA	-122.875	38.632
P3712	Bafang Yunji Foods LLC	Irvine	CA	-117.84	33.689
P3716	Pennsylvania Poultry Farms	Turbotville	PA	-76.769	41.105
P3718	The Gilded Kitchen, Inc., DBA Gyoza Shop	Brooklyn	NY	-73.984	40.691
P3719	Latinos Meat Distributors	Houston	TX	-95.292	29.737
P3723	4475 Peachtree Lakes Drive Operating LLC	Duluth	GA	-84.183	33.976
P3727	Pinnacle Baking Inc.	Belton	TX	-97.49	31.053
P3730	Prairie Packing	Comanche	OK	-97.978	34.36
P3734	J&J Quality Meats LLC	Bourbon	IN	-86.077	41.296
P3745	East Coast Seafood, LLC	New Bedford	MA	-70.923	41.65
P3746	Little Village Frozen Pizza LLC	Bonduel	WI	-88.445	44.74
P3749	Mika's Gourmet Food LLC dba Old Heidelberg	Fort Lauderdale	FL	-80.154	26.092
P3750	Ready Fresh Copackers LLC	Clinton Township	MI	-82.867	42.626
P3756	Aruba's Halal Kitchen	Philadelphia	PA	-75.066	40.009
P3764	Nit Noi Provisions	Norwalk	CT	-73.417	41.097
P3775	Foodture, LLC	Los Angeles	CA	-118.265	33.984
P3776	Stella D's Food LLC	Los Angeles	CA	-118.218	34.079
P3779	Quesitos	Atlanta	GA	-84.264	33.886
P379	Jimenez Mexican Foods Inc.	Perris	CA	-117.248	33.825
P3797	Home Style Foods, Inc	Hamtramck	MI	-83.045	42.401
P3808	LYFE Industries LLC	Wakarusa	IN	-86.001	41.534
P3809	Chicago Prime Supply	Calumet City	IL	-87.528	41.623
P3818	Casa Crobu	Denver	CO	-104.931	39.68
P3825	Clark Fork Custom Meats	Plains	MT	-114.913	47.494
P3828	Philly's Best Steak Company, Inc.	Yeadon	PA	-75.261	39.935
P3831	MK Provisions, Inc.	Los Angeles	CA	-118.219	34.079
P3838	Cool Creations LLC	North Kansas City	MO	-94.583	39.129
P384	Elevation Foods, LLC	Knoxville	TN	-83.85	36.028
P38432	Los Pasteles de La Abuela	Guayama	PR	-66.182	17.952
P38435	Brand Aromatics Inc	Lakewood	NJ	-74.19	40.059
P38439	Walls Gourmet Foods LLC	Las Vegas	NV	-115.206	36.195
P38453	Pinn-Oak Ridge Farm LLC	Delavan	WI	-88.718	42.7
P38456	Yankee Trader Seafood LTD.	Pembroke	MA	-70.772	42.102
P38458	Charlie's Produce	Anchorage	AK	-149.879	61.135
P38463	La Indi Poultry	City of Industry	CA	-117.966	34.023
P38466	Sensenig Turkey Farm LLC	Lititz	PA	-76.287	40.207
P38468	Colorado Premium Foods	Denver	CO	-104.966	39.79
P38474	United States Cold Storage - Wilmington	Wilmington	IL	-88.138	41.321
P38478	Pacific Produce Corporation	Tamuning	GU	144.81	13.502
P38479	B&O Island Style Chamorro Sausage	Tamuning	GU	144.788	13.495
P38487	Fine Foods of South Florida	Pembroke Park	FL	-80.167	25.987
P38493	Seven Nation Food Company	Mount Vernon	NY	-73.822	40.91
P38498	Brothers Meats Processors, LLC	Norcross	GA	-84.236	33.914
P3850	Seattle Samosa LLC	Redmond	WA	-122.094	47.665
P38511	New S.B.L., Inc.	Chicago	IL	-87.651	41.812
P38514	C & S Poultry	Monterey Park	CA	-118.148	34.055
P38521	Ornna Brazilian Sausage Corp.	Orlando	FL	-81.298	28.578
P38522	Metropolitan Foods	Wayne	NJ	-74.265	40.899
P38530	Greenridge Farm, Inc.	Elk Grove Village	IL	-87.946	42.004
P38532	Avanti Foods	Walnut	IL	-89.592	41.558
P38548A	Che Pibe Gourmet Products	Miami	FL	-80.254	25.841
P38549	York Street Caterers Inc.	Englewood	NJ	-73.99	40.887
P38549A	YORK STREET CATERERS INC.	ENGLEWOOD	NJ	-73.989	40.888
P38550	Heritage Specialty Foods, LLC	Milwaukie	OR	-122.594	45.428
P38552	B&M Processing	Chatsworth	GA	-84.789	34.753
P38555	Anco Poultry Processing	Garnett	KS	-95.338	38.247
P38556	Heritage Meats	Rochester	WA	-123.079	46.822
P38560	Los 7 Hermanos Corporation	Houston	TX	-95.492	29.722
P38561	KJPL Restaurants, Inc.	Greene	ME	-70.142	44.192
P38564	Foreman's Boudin Kitchen	Dry Creek	LA	-93.046	30.671
P38565	Trader Gus, Inc.	Waunakee	WI	-89.415	43.151
P386	Thomasville Cold Storage	Thomasville	GA	-83.99	30.855
P3862	Evergreen Refreshments	Spokane	WA	-117.253	47.677
P3868	Seventh Inc. DBA 3Hmong Sausage	St. Paul	MN	-93.151	44.959
P3870	Reser's Fine Foods, Inc.	Topeka	KS	-95.634	39.043
P3871	York Cold Storage Co	York	NE	-97.597	40.873
P3873	From Home LLC	Chantilly	VA	-77.428	38.905
P3874	Nectar of Armenia Inc.	GLENDALE	CA	-118.285	34.164
P3875	Signature Foods, USA, LLC	Easley	SC	-82.485	34.766
P3887	Golden Snacks LLC	Warrenton	VA	-77.683	38.744
P3893	Economy Cash and Carry, Inc.	El Paso	TX	-106.323	31.703
P3897	PA Boys BBQ, LLC	Oxford	PA	-75.98	39.78
P39	Pine Manor Inc.	Orland	IN	-85.169	41.693
P390	Pilgrim's Pride Corporation	Greeley	CO	-104.855	40.412
P3914	DeMaiz Foods	Salt Lake	UT	-111.986	40.731
P3919	Del Monaco Superfoods LLC	Stockton	CA	-121.279	37.897
P3920	Pigeon River Poultry LLC	Howe	IN	-85.427	41.743
P3931	LuBell Foods	Burnsville	MN	-93.26	44.784
P3933	Den Dumpling Co	Denver	CO	-104.991	39.69
P3945	Hardwick Craft Meats, Inc.	Hardwick	MA	-72.247	42.316
P3948	Pflug Packaging	Cartersville	GA	-84.732	34.091
P395	Mrs. Stratton's Salads	Birmingham	AL	-86.855	33.451
P3951	Kitchen of Dana	Cleveland	GA	-83.759	34.608
P3952	Colorado Cold Connect	Fort Morgan	CO	-103.771	40.249
P3955	Seven Hills Food LLC	Buda	TX	-97.843	30.046
P3958	Mockingbird Food Group	Dallas	TX	-96.901	32.774
P3962	Pioneer Poultry, LLC	New Holland	PA	-76.088	40.119
P3972	Ajax Food Group	Chicago	IL	-87.707	41.946
P3975	Harmons Central Production Facility	West Valley	UT	-111.986	40.696
P3978	Wasatch Freeze Dry	West Jordon	UT	-111.992	40.601
P39878	G&D Smokehouse and Mercantile	Yukon	OK	-97.735	35.504
P3988	Courage Production, LLC	Hayward	CA	-122.049	37.612
P39880	LSBBQ Wholesale, LLC	Bensalem	PA	-74.933	40.144
P39881	Virginia Packing LLC	Toano	VA	-76.806	37.411
P39891	Biloxi Beach Group LLC #1	Morton	MS	-89.669	32.35
P39892	Fresh & Ready Foods LLC	San Fernando	CA	-118.419	34.29
P39896	The Fillo Factory	Northvale	NJ	-73.943	40.999
P39897	F&S Produce Co., Inc.	Vineland	NJ	-75.036	39.461
P39898	Bridor USA, Inc.	Bridgeport	CT	-73.163	41.172
P39904	Mountain View Packaging, LLC	Boise	ID	-116.191	43.571
P39913	Jacob Fleishman Cold Storage Inc.	Miami	FL	-80.217	25.85
P39915	LOCUST POINT FARMS, LLC	ELKTON	MD	-75.828	39.559
P39924	BJ's Wholessale Club	Hialeah Gardens	FL	-80.328	25.861
P39927	Southeast Wholesale Foods	Medley	FL	-80.375	25.858
P39928	Mary's Harvest Fresh Foods, Inc.	Portland	OR	-122.638	45.577
P39930	Olympia Provisions	Portland	OR	-122.664	45.521
P39932	JRC Culinary Group Inc.	Monterey Park	CA	-118.145	34.057
P39936	Vertical Cold Storage, LLC	Medley	FL	-80.368	25.874
P39940	Genco	Edwardsville	IL	-90.056	38.765
P39941	Casanova Market, Inc.	Hauppauge	NY	-73.259	40.814
P39942	Farview Farms Meat Company	Topeka	KS	-95.665	39.161
P39944	Prosperity Foodservice Group LLC	Doral	FL	-80.362	25.794
P39949	McCain Foods Snack Plant.	Plover	WI	-89.57	44.456
P39950	Achatz Handmade Pie Company LLC	Chesterfield	MI	-82.806	42.715
P39952	Emil's Pizza, Inc.	Watertown	WI	-88.714	43.173
P39957	Promo International, Inc.	Miami	FL	-80.38	25.884
P39961	Glenn's Market & Catering, Inc.	Watertown	WI	-88.733	43.196
P39961J	Grandpa Glenn's Pet Treats	Johnson Creek	WI	-88.779	43.088
P39963	Hellmann Worldwide Logistics	Miami	FL	-80.366	25.812
P39967	Thrive Life	American Fork	UT	-111.792	40.364
P39967A	Thrive Life	American Fork	UT	-111.787	40.345
P39968	Donald's Meat Processing, LLC	Lexington	VA	-79.43	37.781
P39973	Price Smart, Inc.	Miami	FL	-80.375	25.864
P39986	Honolulu Baking Company	Honolulu	HI	-157.857	21.297
P39991	Quirch Foods	Miami	FL	-80.333	25.843
P39992	Dept of Veterans Affairs	Hampton	VA	-76.332	37.015
P39994	F&S Produce West LLC dba F&S Fresh Foods	Sacramento	CA	-121.396	38.476
P39994A	F&S Produce West LLC dba F&S Fresh Foods	Sacramento	CA	-121.394	38.476
P39998	My Bento & Catering	Honolulu	HI	-157.874	21.34
P39999	Rite Stuff Foods	Jerome	ID	-114.52	42.701
P3FW	Standard Meat Company	Fort Worth	TX	-97.34	32.787
P3JC	Smithfield Packaged Meats Corp.	Junction City	KS	-96.867	39.002
P4	Campbell Soup Supply Company	Napoleon	OH	-84.121	41.386
P40	Pilgrim's Pride Corporation	Ellijay	GA	-84.491	34.685
P40000	Jasper Meats, Inc.	Bloomingdale	IL	-88.13	41.945
P40001	Brett Anthony Foods	Elk Grove Village	IL	-87.967	42.004
P40001A	D.A. Stein Culinary Group	Northbrook	IL	-87.827	42.112
P40017	Northern Culinary Brands, LLC	Plattsburgh	NY	-73.54	44.707
P40026	Hart Food Products Inc	Paramount	CA	-118.161	33.898
P40030	Panapastry, LLC.	Medley	FL	-80.344	25.863
P40031	ACC Central Kitchen LLC	Thorofare	NJ	-75.19	39.838
P40033	Chorizo Janitzio, Inc.	Bakersfield	CA	-119.069	35.438
P40041	Marksbury Farm Foods, LLC	Lancaster	KY	-84.666	37.699
P4005	Williamsburg Packing Company Inc.	Kingstree	SC	-79.815	33.683
P40056	Smoking Goose LLC	Indianapolis	IN	-86.138	39.773
P40059	Legendary Meats, LLC	Marietta	GA	-84.539	33.977
P40062	Dong's Specialty Foods	Virginia Beach	VA	-76.099	36.797
P40074	L&R Fine Food, Inc.	Garden Grove	CA	-117.9	33.776
P40077	Interstate Caterers Inc.	South Plainfield	NJ	-74.432	40.578
P4008	Caribbean Food Delights	Tappan	NY	-73.944	41.032
P40088	Compass Group/Canteen	Middletown	PA	-76.792	40.224
P4009	Dairyland Produce, LLC	Mattapoisett	MA	-70.813	41.677
P40092	Divine Pasta	Burbank	CA	-118.308	34.173
P4010	Euro Food, Inc., DBA Citterio USA Corporation	Freeland	PA	-75.899	41.011
P40103	Lineage Logistics, LLC	Centralia	WA	-122.999	46.761
P4011	High on the Hog Custom Meats	Dittmer	MO	-90.686	38.31
P40114	Gem Food Services Corp.	Rosenberg	TX	-95.782	29.563
P40117	Jerky Junction, Inc	Carson City	NV	-119.724	39.193
P40118	Nob Hill Pizza	San Mateo	CA	-122.312	37.555
P40124	Gold Creek Processing LLC	Gainesville	GA	-83.857	34.27
P40131	Apollo Export Warehouse Inc.	Miami	FL	-80.324	25.837
P40135	Wow Specialty Cuts Corp.	Hialeah Garden	FL	-80.375	25.898
P40145	D & N Provisions	Boston	MA	-71.067	42.329
P40147	This Old Farm Meats and Processing	Colfax	IN	-86.686	40.194
P40161	Global Village Foods	Quechee	VT	-72.421	43.644
P40168	North Georgia Meat Company Inc.	Ellijay	GA	-84.575	34.699
P40171	L&D Market Inc.	East Boston	MA	-71.017	42.386
P40183	Sanderson Farms, Inc.	Kinston	NC	-77.668	35.258
P40187	Americold Logistics, LLC	Lula	GA	-83.727	34.377
P4019	Salumeria Biellese Inc.	NYC	NY	-73.996	40.749
P40190	Vincent Giordano Corp.	Philadelphia	PA	-75.189	39.94
P40191	Goya Foods of Florida	Miami	FL	-80.413	25.795
P40193	AdvancePierre Foods, Inc.	Enid	OK	-97.805	36.418
P4019A	Salumeria Biellese LLC	Hackensack	NJ	-74.046	40.886
P402	Cooking Acquisitions, LLC	Pennsauken	NJ	-75.077	39.928
P40200	America New York Ri Wang Food Group Co., Ltd.	Maspeth	NY	-73.909	40.721
P40200A	America New York Ri Wang Food Group Co., Ltd.	Bay Shore	NY	-73.269	40.765
P40201	Oriental Delight, LLC	Virginia Beach	VA	-76.184	36.885
P40207	Appalachian Ag, LLC	Prestonsburg	KY	-82.866	37.65
P40211	Fresh Food Manufacturing Company	Freedom	PA	-80.15	40.678
P40216	Lilly's Gastronomia Italiana, Inc., DBA Lilly's Fresh Pasta	Everett	MA	-71.062	42.408
P40216A	Lilly's Gastronomia Italiana, Inc., DBA Lilly's Fresh Pasta	Boston	MA	-71.076	42.387
P40217	Happy Hog Meatery	Moscow	ID	-117.004	46.74
P4022	Dietrich's Country Meats	Krumsville	PA	-75.838	40.579
P40221	Prairie Harvest Ltd	Spearfish	SD	-103.875	44.503
P40226	Grupo Salvatex	Katy	TX	-95.731	29.834
P40228	Russian Style Ravioli Inc.	Roselle	NJ	-74.258	40.647
P40230	Uncle Peter L.L.C.	Orion Township	MI	-83.246	42.744
P40232	American Butchers, Inc.	Guaynabo	PR	-66.101	18.408
P40234	Lineage Logistics PFS, LLC	Medley	FL	-80.384	25.891
P40235	Weidner's Deli / Genuine Jerky Inc.	Youngsville	PA	-79.327	41.849
P40236	Mark's Custom Meats	Howard	PA	-77.557	40.998
P40238	Correctional Industries Food Factory	Airway Heights	WA	-117.577	47.654
P40243	Nunez Foods	Miami	FL	-80.257	25.837
P40244	Gray's & Danny's Investment, Inc.	Moore Haven	FL	-81.079	26.782
P40251	Food Kits LLC	Bradley Beach	NJ	-74.016	40.207
P40256	Century Oak Packing Company	Mount Angel	OR	-122.763	45.064
P40262	Blue Star Meat Corp.	Bronx	NY	-73.892	40.81
P40264	Rancher's US OP LLC	Vadnais Heights	MN	-93.052	45.071
P40268	Sinton and Sons Local Meats and Provisions	Paso Robles	CA	-120.69	35.651
P40268A	Sinton and Sons Local Meats and Provisions	Paso Robles	CA	-120.533	35.539
P40269	Boyd Specialties LLC	Colton	CA	-117.311	34.055
P4027	NPC Processing, LLC	Shelburne	VT	-73.214	44.406
P40280	Taylor Farms Southwest Inc.	Tolleson	AZ	-112.245	33.439
P40282	A Full Measure Catering	Advance	NC	-80.41	35.942
P403	West Central Turkeys LLC	Pelican Rapids	MN	-96.086	46.578
P4030	John's Ravioli Company Inc.	New Rochelle	NY	-73.79	40.902
P40300	TORRES PACKING , LLC	Virginia Beach	VA	-76.185	36.892
P40311	Mecca Halal Poultry	Astoria	NY	-73.929	40.755
P40312	La mina Meat& Provisions Corp.	Brooklyn	NY	-73.924	40.698
P40316	Cal Chef Foods, LLC	Stockton	CA	-121.221	37.931
P40316A	CalChef Foods, LLC	Stockton	CA	-121.231	37.936
P40316B	CalChef Foods, LLC	Stockton	CA	-121.218	37.91
P40322	Just Mike's Jerky Company	Medina	OH	-81.879	41.137
P40326	Crescent Meats and Catering LLC	Cadott	WI	-91.148	45.065
P40327	Bestway Sandwiches Inc.	Valencia	CA	-118.591	34.435
P4033	Bianco Inc.	Medford	MA	-71.078	42.407
P40331	LSG Sky Chefs	Denver	CO	-104.666	39.832
P40334	Five Star Meat, Inc., DBA Emir Halal	Middle Village	NY	-73.876	40.707
P40339	Unicold Corporation	Oakland	CA	-122.312	37.806
P40342	The Ohio State University	Columbus	OH	-83.029	40.004
P40345	Misty Lea Farm Poultry Processing	Pembroke	KY	-87.31	36.889
P4035	DTF Prep LLC	City of Industry	CA	-117.965	34.024
P40353	Sysco South Florida	Medley	FL	-80.379	25.888
P40359	Trinity Meat Company LLC	Hartwick	NY	-75.051	42.652
P40363	Pascucci Family Pasta	San Diego	CA	-117.096	32.782
P40365	Four Story Hill Farm Inc.	Honesdale	PA	-75.195	41.704
P40367	Shuler Meats, Inc.	Thomasville	NC	-80.138	35.88
P4037	Plymouth Beef Company, Inc.	Bronx	NY	-73.872	40.807
P40373	Lineage Logistics Bedford Park 1, LLC	Bedford Park	IL	-87.797	41.773
P40374	N.E. Pizza Corp.	Olyphant	PA	-75.606	41.47
P40375A	Villari Food Group	Warsaw	NC	-78.083	34.988
P40381	Champion Foods LLC	New Boston	MI	-83.384	42.131
P40383	The Suter Company	Sycamore	IL	-88.702	41.967
P404	South Chicago Packing LLC	Chicago	IL	-87.649	41.825
P40429	California Natural Products	Lathrop	CA	-121.273	37.825
P40437	Blue Chip Group	Salt Lake City	UT	-111.982	40.73
P40440	RYC Foods, LLC	San Antonio	TX	-98.51	29.44
P40440A	RYC Foods	San Antonio	TX	-98.428	29.322
P40441	Derstine's Inc.	Sellersville	PA	-75.306	40.344
P40453	Summit Hill Foods, Inc.	Rome	GA	-85.174	34.21
P40458	Better Business - - - Better Foods	Milford	NH	-71.665	42.839
P4049	Levan Bros.	Coatesville	PA	-75.842	40.049
P404A	Ed Miniat LLC	South Holland	IL	-87.629	41.598
P4051	M&D Farm, Inc.	Brooklyn	NY	-73.936	40.714
P4058	Sigma Alimentos	South Chesterfield	VA	-77.383	37.307
P4066	Rocco's Italian Specialty Foods, Inc. dba Top Quality Meats	Huntington	WV	-82.495	38.408
P4071	Rosenkrans Natural Beef Company, LLC	Rochester	NY	-77.615	43.09
P4075	Arnold's & Eddies Foods Inc.	Chicopee	MA	-72.591	42.166
P4079	LaJo Genuine Italian Inc.	Altoona	PA	-78.397	40.514
P4082	Mad Local Food Group, LLC dba Pasture and Plenty	Madison	WI	-89.331	43.125
P4087	Northern Liberties Food Processors, Inc.	Philadelphia	PA	-75.2	39.937
P4089	Poultry Products of Manchester, LLC, DBA Prime Source Foods	Londonderry	NH	-71.387	42.93
P4102	Morasch Meats, Inc	Portland	OR	-122.5	45.552
P4102A	Pressure Safe LLC	Wood Village	OR	-122.423	45.538
P4104	Palisades Ranch	Vernon	CA	-118.209	33.988
P4111	Wycen Foods, Inc.	San Leandro	CA	-122.156	37.716
P4114	West Coast Prime Meats LLC	Brea	CA	-117.889	33.923
P4118	Santa Fe Importers, Inc.	Long Beach	CA	-118.216	33.784
P4119	The Hillshire Brands Company	San Lorenzo	CA	-122.153	37.669
P412	Alpine Meats Inc.	Stockton	CA	-121.318	38.042
P4121	Custom Corned Beef LLC	Wiggins	CO	-104.057	40.24
P4121A	Custom Made Meals, LLC	Denver	CO	-104.982	39.797
P4123	Serv-Rite Meat Company, Inc.	Los Angeles	CA	-118.24	34.107
P4131	Food Technology Corp.	Henderson	NV	-115.025	36.068
P4132	Schreiner's Fine Sausages	Glendale	CA	-118.229	34.201
P4135	Heartland Meat Company, Inc	Chula Vista	CA	-117.06	32.592
P4138	Green Plant LLC	Miami	FL	-80.369	25.915
P4139	Green Plant LLC	Miami	FL	-80.255	25.828
P4146	Mountain Meat Packing Inc.	Craig	CO	-107.541	40.511
P4150	Tommy's Quality Meats	San Diego	CA	-117.139	32.695
P4156	Western Meat Service	Denver	CO	-104.98	39.799
P4158	Diana's Mexican Food Products Inc.	Lawndale	CA	-118.349	33.876
P4159	HV Randall Foods, Inc.	Vernon	CA	-118.217	33.999
P4159A	HV Randall Foods, LLC	Vernon	CA	-118.18	34.0
P4160	People's Sausage Company, Inc.	Los Angeles	CA	-118.247	34.03
P4163	Ancestral Pastures LLC	Lytle	TX	-98.794	29.227
P4169	Longhorn Barbecue Production Center	Spokane	WA	-117.265	47.68
P4177	Leyen Food, LLC	La Puente	CA	-117.989	34.029
P4178	Quentin Meat Inc.	Santa Fe Springs	CA	-118.053	33.94
P4181	Mao Foods, Inc.	Los Angeles	CA	-118.24	34.006
P4183	Brit Boy Street Food LLC	Kansas City	MO	-94.595	39.182
P4187	Wayne Provisions Company, Inc.	Vernon	CA	-118.191	33.995
P419	Case Farms Processing	Morganton	NC	-81.684	35.736
P4191	Mikailian Meat Products, Inc.	Valencia	CA	-118.578	34.434
P4192	Dale's Wild West Products	Brighton	CO	-104.819	39.989
P4195	Newport Meat Southern California, Inc.	Irvine	CA	-117.833	33.695
P42	Edmond's Chile Co. Inc	Saint Louis	MO	-90.23	38.597
P4202	Green's Quality Meats	Celina	OH	-84.575	40.561
P4203	Kettle River Products	Askov	MN	-92.781	46.191
P4205	Big Boy Food Group LLC	Warren	MI	-83.063	42.474
P4209	MMM Meat, LLC	Grand Rapids	MI	-85.693	42.942
P4215	Skylark Meats, LLC	Omaha	NE	-96.086	41.215
P4219	Wald Family Foods, LLC	Omaha	NE	-96.055	41.217
P4226	Buddy's Kitchen, Inc.	Burnsville	MN	-93.275	44.785
P4226B	Buddy's Kitchen, Inc.	Lakeville	MN	-93.227	44.643
P423	JBS Prepared Foods - Booneville	Booneville	MS	-88.556	34.669
P4230A	Omaha Steaks International Inc.	Omaha	NE	-96.056	41.217
P4233	National Beef Ohio, LLC	North Baltimore	OH	-83.646	41.185
P4235	Mr. Pizza Inc	Anderson	IN	-85.673	40.094
P424	OWP Boston, LLC	Randolph	MA	-71.07	42.182
P4245	Brandy Meats, Inc.	Cincinnati	OH	-84.535	39.134
P4246	Webster City Custom Meats, Inc.	Webster City	IA	-93.785	42.472
P4247	ConAgra Brands, Inc.	Fort Madison	IA	-91.437	40.576
P425	Northern Pride, Inc.	Thief River Falls	MN	-96.175	48.114
P4255	Mineo and Sapio's	Buffalo	NY	-78.886	42.907
P4257	Oscar's Hickory House Inc.	Warrensburg	NY	-73.78	43.501
P425A	Northern Pride Inc.	Thief River Falls	MN	-96.177	48.113
P425B	Kenosha Beef International Ltd	Kenosha	WI	-87.99	42.613
P4260	Glazier Packing Company Inc.	Potsdam	NY	-75.051	44.648
P4264	Ellio's Pizza	Lodi	NJ	-74.07	40.884
P4265	Locust Grove Farm	Argyle	NY	-73.488	43.216
P4266	Meat & Fisheries Processing Laboratory	Cobleskill	NY	-74.504	42.671
P427	Land O' Frost	Lansing	IL	-87.545	41.589
P4271	GREISE BROTHERS PACKING INC.	CUMBERLAND	MD	-78.743	39.693
P4273	SALARINO'S ITALIAN FOOD INC.	CANASTOTA	NY	-75.753	43.077
P4280	White Eagle Packing Company Inc.	Schenectady	NY	-73.953	42.799
P4286	Rosina Food Products. Inc.	Cheektowaga	NY	-78.748	42.869
P4286A	Rosina Food Products, Inc.	West Seneca	NY	-78.759	42.863
P4286B	Rosina Food Products, Inc.	West Seneca	NY	-78.765	42.86
P4286C	Rosina Food Products, Inc.	Buffalo	NY	-78.763	42.86
P42886	EDCA Foods	Modesto	CA	-120.987	37.618
P429	K & S Sausage	Niagara	WI	-88.036	45.774
P4293	Smith's Log Smokehouse	Monroe	ME	-69.083	44.564
P4322	Japan Premium Beef, Inc.	Bronx	NY	-73.875	40.807
P4335	Milan Provision Co., Inc.	Corona	NY	-73.858	40.751
P4348	Hanover Foods Corporation	Hanover	PA	-76.947	39.809
P4357	Camellia General Provision Co., Inc.	Buffalo	NY	-78.83	42.906
P4365	Frank Wardynski & Sons, Inc.	Buffalo	NY	-78.842	42.888
P4367	Lancaster Quality Pork, Inc.	Brooklyn	NY	-74.022	40.647
P4368	Gondola Brand Macaroni Products, Inc	Buffalo	NY	-78.904	42.938
P4369	Jack Toney Wholesale Meats	Warrensburg	NY	-73.776	43.497
P4376A	Cibao Meat Products, LLC	Rockaway	NJ	-74.494	40.919
P4377	Wonder Meats Inc.	Carlstadt	NJ	-74.079	40.832
P4390	Curtis Custom Meats	Warren	ME	-69.21	44.141
P4395	Chef's Delight Packing Co., Inc.	Brooklyn	NY	-73.96	40.72
P4396	Pork King Sausage, Inc.	Bronx	NY	-73.873	40.807
P4398	DiLuigi Foods, Inc	Danvers	MA	-70.975	42.564
P4400	U.F.S. Industries, Inc.	Mount Vernon	NY	-73.845	40.919
P4405	JAS Meats, Inc.	Brooklyn	NY	-73.997	40.664
P44051	Eagle Maritime Services Inc.	Miami	FL	-80.33	25.785
P44052	Cal Poly Meats	San Luis Obispo	CA	-120.68	35.32
P44055	MSI Express Inc	Grand Prairie	TX	-97.055	32.787
P44056	F&S Fresh Foods	Houston	TX	-95.293	29.65
P44058	Cedarlane Natural Foods, LLC	Carson	CA	-118.254	33.875
P44062	Stuffed Foods LLC	Wilmington	MA	-71.155	42.524
P44072	Penaloza's Food, Inc.	Hawaiian Gardens	CA	-118.065	33.831
P44082	Blue Frog Foods LLC	Austell	GA	-84.634	33.812
P44097	DG Foods, LLC	Bastrop	LA	-91.898	32.757
P44099	Ridley's Family Markets	Twin Falls	ID	-114.478	42.54
P44121	Pelleh Poultry Corp.	Swan Lake	NY	-74.857	41.706
P44122	Alle-Pia	Atascadero	CA	-120.655	35.473
P44126	LiDestri Foods, Inc.	Rochester	NY	-77.68	43.187
P44127	Adesa International LLC	Ontario	CA	-117.612	34.048
P44127B	Adesa International LLC	San Bernardino	CA	-117.277	34.057
P44134	Surlean Meat Company	Dallas	TX	-96.919	32.702
P44137	Nello's Specialty Meats	Nazareth	PA	-75.283	40.764
P44149	Chickasha Meat Company, LLC	Chickasha	OK	-97.899	35.044
P44150	Golden Grains Bakery	Charlotte	NC	-80.884	35.16
P44151	JSW Farm Chop Shop, Inc.	Hazel Green	KY	-83.342	37.767
P44162	The Pierogi Guy	Rochester	NY	-77.727	43.217
P44163	Tempura Foods & Spices LLC	Houston	TX	-95.538	29.874
P44164	Dorada Foods	Ponca City	OK	-97.11	36.726
P44176A	Stittsworth Smokehouse Co.	Turtle River	MN	-94.764	47.598
P44182	Albaghdadi Food Inc.	Warren	MI	-83.008	42.463
P44187	Sukhi's Gourmet Indian Foods	Hayward	CA	-122.121	37.632
P44189	American Custom Meats LLC	Tracy	CA	-121.434	37.768
P44193	Clint & Sons	White Deer	TX	-101.174	35.435
P44195	D.M. Stokke Inc.	Cloquet	MN	-92.365	46.803
P442	Seabrite Corp.	Newark	NJ	-74.136	40.733
P44214	Loham, Inc.	Colton	CA	-117.322	34.083
P44215	Sea Watch International	Milford	DE	-75.417	38.913
P44220	United Group Meats LLC	Newark	NJ	-74.179	40.718
P443	Glenn Valley Foods, LLC.	Omaha	NE	-96.019	41.216
P4445	Picone Meat Specialties LTD	Mamaroneck	NY	-73.737	40.956
P445	Wayne Farms, LLC	Dobson	NC	-80.712	36.391
P4460	Great American Foods	Newark	NJ	-74.146	40.718
P4466	Dino's Sausage & Meat Co., Inc.	UTICA	NY	-75.216	43.099
P44741	Mickey's Wholesale Pizza	York	PA	-76.7	39.863
P44742	Kimia Kitchen	santa Ana	CA	-117.852	33.74
P44750	Kosher R Us	Brooklyn	NY	-74.022	40.647
P44753L	Tall Hat Foods	Lindon	UT	-111.748	40.334
P44754	Tamahli	San Antonio	TX	-98.503	29.554
P44762	TJ Processors, LLC	Seattle	WA	-122.339	47.564
P44764	SOPAKCO, Inc.	Mullins	SC	-79.263	34.202
P44778	Holy Pierogies	Wolcott	CT	-72.974	41.562
P44781	Sterling Foods	Union City	CA	-122.032	37.598
P44788	Old Fashion Country Butcher	Santa Paula	CA	-119.065	34.347
P44797	CCB Packaging, Inc.	Hiawatha	IA	-91.691	42.058
P44798	Erika Lynch LLC	Waitsfield	VT	-72.838	44.187
P4480	Croghan Meat Market ,Inc.	Croghan	NY	-75.392	43.895
P44801	Halal Transaction of USA llc	Kinsman	IL	-88.567	41.192
P44803	Gourmet 3005 Inc.	Hialeah	FL	-80.33	25.893
P44805	The Heywoods Group Corp	Atlanta	GA	-84.425	33.788
P44809	Lionshare LLC	Houston	TX	-95.398	29.847
P44814	Aufschnitt Meats LLC	Owings Mills	MD	-76.781	39.414
P44817	Chick-A-Ray Poultry & Egg Co., Inc.	Albemarle	NC	-80.255	35.319
P44818	Taylor Farms Florida, Inc.	Orlando	FL	-81.413	28.456
P44819	Fatback	Eva	AL	-86.723	34.311
P4482	Kelley Meats LLC	Taberg	NY	-75.613	43.295
P44821	Good to Go Fresh	Chicago	IL	-87.65	41.9
P44824	Western Meat Processing, Inc.	Modesto	CA	-120.997	37.619
P44826	Case Farms Processing	Canton	OH	-81.349	40.832
P44836	Khuus Sausage, Inc.	Monrovia	CA	-118.003	34.141
P44838	Hunter Cattle Company	Brooklet	GA	-81.557	32.372
P44847	Great North Pizza Inc.	Detroit Lakes	MN	-95.831	46.835
P4485	PREVITES MEATS AND PROVISIONS	WEYMOUTH	MA	-70.921	42.194
P4486	N S Brandon Packing Inc.	Otego	NY	-75.174	42.393
P44869	Trig's Smoke House	Rhinelander	WI	-89.397	45.656
P44870	Rana Meal Solutions, LLC	Bartlett	IL	-88.229	41.984
P44874	SMC Foods, LLC	Statham	GA	-83.592	33.959
P44877	Nonna's Homestyle Foods	St. Louis	MO	-90.284	38.571
P4488	Valley Meat Packing Corp.	Newark Valley	NY	-76.118	42.188
P44883	Fusion Ranch, Inc.	Scottsbluff	NE	-103.589	41.864
P44891	Kukui Meat Market	Honolulu	HI	-157.881	21.326
P44892	R. Walters, LLC, DBA Elevation Foods	Danvers	MA	-70.947	42.56
P44902	Old Fashioned Foods, Inc.	Mayville	WI	-88.545	43.504
P44904	AA Meat Products Inc.	Commerce	CA	-118.133	34.006
P44910	Rising Spring Meat Co.	Spring Mills	PA	-77.566	40.853
P44913	Villarina's Pasta & Fine Foods	Danbury	CT	-73.421	41.388
P44915	D & H CUSTOM MEATS LLC	BLACKSVILLE	WV	-80.231	39.718
P44919	Cuisine Solutions, Inc.	Sterling	VA	-77.444	38.994
P44926	Sun Foods	Detroit	MI	-83.135	42.396
P44930	Huang's Meat Trading	Brooklyn	NY	-74.01	40.653
P44934	Bronson Locker LLC	Bronson	KS	-95.073	37.895
P44935	Gold Creek Processing LLC	Gainesville	GA	-83.804	34.223
P44936	Gracie's Kitchens, Inc.	New Haven	CT	-72.921	41.294
P44941	Alcor Foods, Inc.	Bayamon	PR	-66.162	18.356
P44942	Glondo's Sausage Co.	Cle Elum	WA	-120.935	47.194
P44946	Romeo Foods Inc	Brooklyn	NY	-74.005	40.616
P44947	Two Brothers for Wholesale Chicken, Inc.	Jamaica	NY	-73.802	40.7
P44950	Schrader Farms, LLC	Romulus	NY	-76.836	42.745
P44954	Global Food Corp.	Medley	FL	-80.382	25.883
P44956	Husks Unlimited Inc.	San Diego	CA	-116.933	32.559
P44965	CLW Foods, LLC	Vernon	CA	-118.212	34.006
P44972	Wyoming Authentic Products LLC	Cody	WY	-109.04	44.514
P44974	Goffle Road Poultry Farm	Wyckoff	NJ	-74.148	40.974
P44976	Empacadora y Procesadora del Sur	Coamo	PR	-66.366	18.076
P44979	Papa Pasquale Ravioli and Pasta Company	Brooklyn	NY	-74.005	40.616
P44980	New Horizon Cuisine	Ankeny	IA	-93.594	41.716
P44985	Bowman's Butcher Shop, LLC	Aberdeen	MD	-76.217	39.54
P4499	Tri-Town Packing Corporation	Brasher Falls	NY	-74.787	44.863
P44992	Windy Meadows Family Farm	Campbell	TX	-95.907	33.182
P44993	Musa Halal Slaughter House, LLC	Tampa	FL	-82.393	28.004
P44A	Conagra Brands, Inc.	Quincy	MI	-84.822	41.962
P45	ConAgra Brands, Inc.	Council Bluffs	IA	-95.85	41.251
P45001	Day Day's Skins & Cracklings	Marietta	NC	-79.129	34.366
P45006	Great American Deli, LLC	Ooltewah	TN	-85.059	35.079
P45008	Carrington Foods, Inc	Saraland	AL	-88.067	30.804
P45009	Readywise Inc.	Salt Lake City	UT	-111.969	40.737
P45014	Mrs. Williams Country Kitchen Inc.	Westlake Village	CA	-118.832	34.158
P45015	American Pasteurization Company	West Sacramento	CA	-121.541	38.569
P45020	Yuris Food, LTD	Houston	TX	-95.521	29.869
P45026	TRADITIONAL SNACK, INC	Miami	FL	-80.315	25.822
P45029	Vermont Packinghouse, LLC	North Springfield	VT	-72.541	43.331
P45031	Cheesewich LTD	Hodgkins	IL	-87.86	41.767
P45048	New Manna Food	Tamuning	GU	144.814	13.516
P45053	Pacific Prime Meats, LLC	Vernon	CA	-118.208	34.006
P45056	L&G Food Inc.	El Monte	CA	-118.068	34.056
P45062	Shorty's Sandwich Shop	Phoenix	AZ	-112.0	33.407
P45064	Dan O's. LLC	St. Charles	MO	-90.515	38.835
P45068	NY Livestock Market Inc.	Brooklyn	NY	-73.929	40.714
P45073	Vertical Cold Storage LLC	Pooler	GA	-81.248	32.166
P45074	Get Fresh Kitchen	Las Vegas	NV	-115.095	36.076
P45080	Bas Foods Inc.	Hayward	CA	-122.053	37.623
P45086	The Centerville Pie Company	Sandwich	MA	-70.486	41.719
P45091	Taher, Inc.	Plymouth	MN	-93.41	45.047
P45093	AleCon Enterprises Inc.	Pelham	NH	-71.319	42.705
P45096	Traditions Prepared Meals, LLC	Sacramento	CA	-121.563	38.68
P45099	Responsible Transportation LLC	Sigourney	IA	-92.18	41.365
P45103	Archie's Foods, Inc.	Skokie	IL	-87.738	42.026
P45106	Grab & Go, LLC	Boston	MA	-71.065	42.329
P45119	Red Barn Meats, Inc.	Croghan	NY	-75.349	43.872
P45123	Cape Code Cafe Foods	Brockton	MA	-71.017	42.066
P45131	Farbest Foods, Inc.	Vincennes	IN	-87.524	38.627
P45139	Peer and Mariah Foods	Greenfield	IN	-85.906	39.778
P45141	Fieldsource Food Systems, Inc.	Brea	CA	-117.895	33.922
P45143	Craft Kitchens	Maryland Heights	MO	-90.443	38.705
P45147	Choice Products USA	Eau Claire	WI	-91.542	44.835
P45150	Tandem USA, LLC	Schaumburg	IL	-88.093	42.002
P45163	Espuna, LLC	Gloversville	NY	-74.355	43.033
P45170	Marchiano's Bakery LLC	Philadelphia	PA	-75.225	40.031
P45179	Roger's Poultry	Los Angeles	CA	-118.237	33.978
P45189	Woody's Oasis Mediterranean, LLC	East Lansing	MI	-84.498	42.719
P45190	Garden Path Farms	Newburg	PA	-77.516	40.145
P45192	Nibai Inc.	South El Monte	CA	-118.061	34.049
P45195	Gateway America LLC	Gulfport	MS	-89.071	30.4
P451B	Sterling Foods, Inc.	Opa Locka	FL	-80.262	25.892
P4520	Symrise	Branchburg	NJ	-74.713	40.599
P45204	Russ Davis Wholesale, Inc.	Saint Paul	MN	-93.106	44.961
P45209	Texas County Meat Processing, LLC	Cabool	MO	-92.1	37.113
P45210	Pennsylvania Food Corporation	Charleroi	PA	-79.886	40.122
P45212	Wakou USA Inc.	Santa Fe Springs	CA	-118.035	33.899
P45217	Choice Canning Company Inc.	PIttston	PA	-75.77	41.308
P45220	Hilltown Country Smokehouse LLC	New Lebanon	NY	-73.417	42.469
P45232	Marne Specialties and Meats, LLC	Kent City	MI	-85.758	43.22
P4524	Family Food Products, Inc.	Bensalem	PA	-74.923	40.107
P45243	Mama La's Kitchen, LLC	Houston	TX	-95.332	29.723
P45251	Portillo's Hot Dogs, LLC.D/B/A Portillo's Food Service, LLC	Addison	IL	-88.033	41.92
P45255	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Romeoville	IL	-88.111	41.659
P45256	Truvant Foods NA, LLC	Boscobel	WI	-90.694	43.144
P45257	PurFoods, LLC	Grinnell	IA	-92.725	41.706
P45262	The Kitchen Inc.	Sterling Heights	MI	-83.041	42.554
P45265	El Zipote Foods	Montebello	CA	-118.12	33.995
P45269	Epicurean Catering LLC	Las Vegas	NV	-115.204	36.076
P4528	Big Mouth/Cudlins	Newfield	NY	-76.617	42.347
P45286	KMB Foods	San Bernardino	CA	-117.287	34.082
P45288	California Ranch Food Company	Vernon	CA	-118.205	34.003
P45288B	FW Farms LLC.	Fort Worth	TX	-97.299	32.648
P45292	Oliveros Distribution Commissary	Turlock	CA	-120.877	37.491
P45302	Freedom Meats Inc.	Las Vegas	NV	-115.177	36.136
P45314	Korte Meat Processing Inc.	Highland	IL	-89.698	38.743
P45316	Fotis And Son Imports, Inc.	Huntington Beach	CA	-118.027	33.738
P45316A	Fotis and Son Imports, Inc.	Huntington Beach	CA	-118.027	33.739
P45317	Kitchen Cuts LLC.	Maywood	CA	-118.171	33.983
P4532	Owasco Meat Company, Inc.	Moravia	NY	-76.419	42.718
P45322	Mama Vicky's Inc.	North Hollywood	CA	-118.373	34.195
P45330	Baily International, LLC	Granite City	IL	-90.159	38.706
P45332	Fifty Four Eleven Store 2 LLC	Chicago	IL	-87.679	41.91
P45334	OLLI SALUMERIA AMERICANA	OCEANSIDE	CA	-117.29	33.214
P45335	Bakkavor US - Carson	Carson	CA	-118.25	33.866
P45339	Buckskins L.L.C.	Newton	AL	-85.61	31.252
P45341	Integrated Marketing Technologies, Inc.	Brunswick	OH	-81.791	41.25
P45342	DETROIT HALAL PROCESSING PLANT	Fowlerville	MI	-84.034	42.599
P45344	Allen Brothers LLC	Las Vegas	NV	-115.259	36.084
P45345	Wheatech Food CA Inc.	Irwindale	CA	-117.936	34.109
P45348	NGPM Food Products	Aibonito	PR	-66.278	18.13
P45360	JLM Manufacturing	Warren	MI	-82.979	42.486
P45361	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Wilmington	OH	-83.775	39.445
P45362	Authentic Brands of Chicago	Bedford Park	IL	-87.782	41.758
P45367	SK Food Group	Groveport	OH	-82.926	39.851
P45367A	SK Food Group Inc	Columbus	OH	-82.943	39.825
P45371	Wilson Processing Company, Inc.	Westminster	SC	-83.029	34.676
P45377	3D Meats, LLC	Dalton	OH	-81.719	40.801
P45379	Brakebush Hartwell, LLC	Hartwell	GA	-82.966	34.337
P4538	T.O. Nam Sausage, Inc.	Cranston	RI	-71.426	41.776
P45387	Rich Products Corporation	Crest Hill	IL	-88.139	41.578
P45394	CM & R, Inc.	St. Paul	MN	-93.026	44.963
P45399	Masterson's Food & Drink Inc	Louisville	KY	-85.728	38.251
P45403	Watkins Ranch Butcher Shop	Meiners Oaks	CA	-119.276	34.448
P45404	Urseilas Meat II	Los Angeles	CA	-118.301	33.989
P45407	Ameripack Foods LLC	Hughes Springs	TX	-94.634	32.968
P45419	Egea Food LLC	Miami	FL	-80.19	25.947
P4542	Kennedy Meat Market	Randolph	NY	-79.0	42.168
P45420	Dockside Seafood	San Juan	PR	-66.101	18.413
P45427	Phil's Farm	Hutchinson	KS	-98.014	37.992
P45431	West Liberty Foods, LLC	Bolingbrook	IL	-88.085	41.674
P45433	Halperns' Steak and Gary's Seafood	Orlando	FL	-81.415	28.448
P45434	Demaiz Inc. dba: Mextamale Foods	San Jose	CA	-121.863	37.347
P45435	Beef Jerky Unlimited	Luna Pier	MI	-83.447	41.808
P45439	Tri Eagle LLC	Gary	IN	-87.359	41.556
P45440	Lineage Logistics LLC	Stevens Point	WI	-89.501	44.511
P45444	Janey Lou's, LLC	Salt Lake City	UT	-112.035	40.781
P45448	VAM Foods LLC	Conroe	TX	-95.405	30.297
P45449	Favazza Specialty Foods	Maryland Heights	MO	-90.437	38.719
P45455	Century Harvest LLC	Greenback	TN	-84.183	35.652
P45457	Evergreen Poultry	Fort Worth	TX	-97.326	32.703
P45458	Shale Spring Meats, LLC	Clyde	NY	-76.879	43.112
P45459	Waterloo Poultry Processing LLC	Clinton	WI	-88.933	42.575
P45462	Berix Coffee Deli LLC	St. Louis	MO	-90.269	38.58
P45464	Victor Provisions	Brooklyn	NY	-73.935	40.71
P45467	Deering's Jerky Co.	Interlochen	MI	-85.802	44.658
P45469	Latitude 36 Foods LLC	West Chester	OH	-84.443	39.328
P45471	New Angus, LLC	Aberdeen	SD	-98.484	45.428
P45475	YouBite, LLC	Camarillo	CA	-119.093	34.218
P45476	Fresno Meat Cuts, LLC	Fresno	CA	-119.778	36.726
P45477	Rotisystems Inc.	San Leandro	CA	-122.18	37.708
P45477A	Rotisystems, Inc.	Oakland	CA	-122.203	37.742
P45479	Rettland Farm, LLC	Gettysburg	PA	-77.175	39.784
P4548	Palmer Food Service	Rochester	NY	-77.669	43.111
P45482	J&J Smoked Meats	Cadillac	MI	-85.416	44.228
P45483	Peco Foods, Inc.	Pocahontas	AR	-90.958	36.214
P45484	Southern Hens Inc	Moselle	MS	-89.306	31.526
P45487	BakeMex	Garland	TX	-96.672	32.873
P45493	Julius Falkavage LLC	Stevens Point	WI	-89.447	44.457
P45499	Jemstar Meats LLC	Mt. Sterling	KY	-83.949	38.127
P45504	VKGG Inc.	Wheatridge	CO	-105.108	39.787
P45505A	Mama Cho's BBQ	San Leandro	CA	-122.148	37.741
P45508	Kraft Heinz Foods Company	Garland	TX	-96.663	32.907
P45510	Queen City Fresh Foods, LLC	Lackawanna	NY	-78.846	42.817
P45517	Trailtopia LLC	Byron	MN	-92.659	44.029
P45522	Tequenomania	Miami	FL	-80.359	25.593
P45523	Fresco Foods, Inc.	Tampa	FL	-82.344	27.972
P45523A	Fresco Foods, Inc.	Hatfield	PA	-75.307	40.272
P45525	Pine Creek Processing LLC	Ridgeland	WI	-91.892	45.208
P45526	Katie's Snack Foods	Hilliard	OH	-83.129	40.042
P4553	Alex & George Wholesale Meats, Inc.	Rochester	NY	-77.552	43.146
P45530	Foodway	Shreveport	LA	-93.766	32.489
P45534	Vista Meat Processing LLC	Milpitas	CA	-121.889	37.425
P45537	Nestle R&D Center Inc.	Solon	OH	-81.471	41.408
P45544	Northeast Prime Veal, LLC	Taylor	PA	-75.702	41.399
P45545	Lagudi Fresh Food Group	Las Vegas	NV	-115.215	36.089
P45547	Mucca, Inc.	Gardena	CA	-118.303	33.902
P45553	Sonoma Muffin Works	Sebastopol	CA	-122.811	38.385
P45556	Green Dining Table, Inc.	Alhambra	CA	-118.147	34.083
P45557	El Charrito Foods, Inc.	City of Industry	CA	-117.973	34.029
P45565	Farm Fresh Foods, LLC	Guntersville	AL	-86.283	34.31
P45571	Rana Meal Solutions	Barlett	IL	-88.222	41.984
P45572	BJG Meat Co LLC	Grandin	MO	-90.752	36.826
P45585	The Butcher Block & Smokehouse LLC	Versailles	OH	-84.571	40.19
P45588	Mosul Kubba	Troy	MI	-83.182	42.545
P45594	John's Meats, LLC	Brooklyn	NY	-73.932	40.664
P45597	Premier Custom Foods	Kansas City	KS	-94.628	39.079
P45599	Lake Haven Custom Meat Processing, LLC	Sturgeon Lake	MN	-92.716	46.402
P456	Bad River Jerky	Chamberlain	SD	-99.329	43.812
P45608	Pure Country Harvest LLC	Moses Lake	WA	-119.303	47.102
P45609	Empanadas 305	Hialeah	FL	-80.287	25.847
P45613	Divine Pasta Co.	Los Angeles	CA	-118.24	34.04
P45616	TFC Foods Specialty Inc.	South El Monte	CA	-118.068	34.058
P45617	Nathan's Soup & Salad	Rochester	NY	-77.614	43.089
P45622	Salt Marsh Foods, Inc.	New Bedford	MA	-70.945	41.652
P45623	Good Foods Group, LLC	Pleasant Prairie	WI	-87.914	42.527
P45624	George Brothers & Associates Inc	Ann Arbor	MI	-83.731	42.261
P45625	The Flying Meatballs LLC	Easton	PA	-75.268	40.729
P45626	F-16 Custom Cuts LLC	Bronx	NY	-73.872	40.807
P45628	Sunrise Deli LLC	Hibbing	MN	-92.942	47.426
P45638	Trilogy Foods LLC	Gainesville	GA	-83.807	34.26
P45640	Brazilian Taste	Lexington	SC	-81.173	33.972
P45643	Sendjoeskcbbq, LLC	Olathe	KS	-94.768	38.912
P45647	Screamin' Ridge Farm Inc.	Montpellier	VT	-72.572	44.254
P4565	Garfield's Smokehouse, Inc.	Meriden	NH	-72.258	43.546
P45652	Shah's Halal Food & Products Inc.	Jamaica	NY	-73.81	40.698
P45659	Embutidos Fanguito Inc.	Miami	FL	-80.22	25.799
P45664	El Paso Prepared Foods	El Paso	TX	-106.319	31.729
P45682	Sky Blue Enterprises LLC.	Chicago	IL	-87.651	41.812
P45686	Rio Bravo Distribution	Phoenix	AZ	-112.055	33.445
P45687	Meat Palace Corp.	Brooklyn	NY	-73.874	40.663
P45690	Selim's Doner Kebap House L.P.	Dallas	TX	-96.702	32.912
P45692	Barakah Kabab Inc.	Detroit	MI	-83.214	42.344
P45693	Harvest Kitchen	Ann Arbor	MI	-83.752	42.333
P45694	Ruiz Food Products, Inc.	Florence	SC	-79.685	34.27
P45696	The Honest Stand	Niwot	CO	-105.177	40.091
P45705	Meat Processing Career Center	Orient	OH	-83.148	39.803
P45710	Sky Chefs, LLC	Phoenix	AZ	-112.021	33.415
P45712	Boar's Head Provisions Co., Inc.	New Castle	IN	-85.386	39.872
P45715	Uncle Henry's Gourmet Meats	Troy	MI	-83.123	42.557
P45719M	Assemblers Inc.	McCook	IL	-87.835	41.804
P45721	Perfecto Foods Inc.	Bell	CA	-118.195	33.979
P45724	Dandee Foods	Jacksonville	FL	-81.696	30.356
P45729	Westcliffe Meats	Westcliffe	CO	-105.479	38.087
P4573	Forest Pork Store, Inc.	Ridgewood	NY	-73.903	40.707
P45744	The BrothFarm LLC	Siren	WI	-92.396	45.783
P45746	FiveStar Gourmet Foods	Naples	FL	-81.68	26.162
P45750	New York Meat and Fish Market	Bronx	NY	-73.92	40.804
P45753	Young Ocean, Inc.	Kent	WA	-122.234	47.42
P45754	EL CHURRY, INC	SAN JUAN	PR	-66.079	18.347
P45756	Nutrition, Inc.	Girard	OH	-80.665	41.19
P45758	CP Fresh	Seattle	WA	-122.312	47.521
P45761	Classroom Kitchen, LLC	Phoenix	AZ	-112.112	33.583
P45762	La Nonna Kitchen LLC	Los Angeles	CA	-118.264	33.984
P45764	S Street Management	Fort Lauderdale	FL	-80.143	26.086
P45766	Rico's Burritos	Watkins	CO	-104.584	39.639
P45769	Colorado Native Foods LLC	Denver	CO	-104.857	39.784
P45772A	Diller Locker Company	Diller	NE	-96.935	40.11
P45773	International Meat Processors Inc.	Long Beach	CA	-118.203	33.787
P45773A	International Meat Processor SF	San Francisco	CA	-122.394	37.725
P45783	Service Cold Storage / Port Everglades Frozen Storage LLC	Fort Lauderdale	FL	-80.142	26.085
P45798	Del Monte Capitol Meat Company, LLC	Reno	NV	-119.799	39.551
P45800	Cedarlane Natural Foods, LLC	Carson	CA	-118.264	33.875
P45806	Schneider's Fish and Seafood Corp.	Cheektowaga	NY	-78.759	42.87
P45808	Mazzone Pasta LLC	Bloomingdale	IL	-88.125	41.949
P45819	King and Sons Poultry Service Inc	Bradford	OH	-84.501	40.152
P45832	VERONI USA, INC	LOGAN	NJ	-75.371	39.769
P45835	Taylor Farms	Des Moines	WA	-122.305	47.414
P45836	Hillcrest Meats LLC	Garden City	SD	-97.669	44.947
P45843	Conger Meat Market, LLC	Conger	MN	-93.529	43.614
P45847	Kencor Ethnic Foods, Inc.	Canton	IL	-90.069	40.559
P45848	Tanks Meats Inc.	Elmore	OH	-83.299	41.467
P45850	South Florida Food Merchants	Davie	FL	-80.21	26.06
P45851	Italian Ready Meals LLC	Waltham	MA	-71.237	42.374
P45853	Macelleria DeMaria LLC	Cortland Manor	NY	-73.853	41.267
P45855	Interstate Foods Inc.	Compton	CA	-118.207	33.894
P4586	TMAC Food Services, Inc.	Buffalo	NY	-78.871	42.875
P45860	Tucson Tamale Wholesale Company LLC	Tucson	AZ	-111.0	32.253
P45874	Midwest Regional Processing LLC	Sun Prairie	WI	-89.187	43.206
P45877	Great Plains Beef	Lincoln	NE	-96.607	40.86
P45883	Foodie'J Inc	Woodbine	GA	-81.683	30.843
P45884	Chef Creations LLC	Forest Park	GA	-84.379	33.608
P45886	TF Foods, LLC	San Diego	CA	-117.165	32.884
P45888	Master Sausage LLC	Orlando	FL	-81.428	28.509
P45889	IVY CITY SMOKEHOUSE	WASHINGTON	DC	-76.986	38.915
P45890	Gourmet Express Marketing, Inc.	Addison	IL	-88.025	41.922
P45891	Kassian Farms LLC	Bronx	NY	-73.921	40.803
P45896	International Frozen Products USA LLC	Miami	FL	-80.194	25.941
P45899	FAMILY KITCHEN RAVIOLI	FLANDERS	NJ	-74.701	40.88
P45901	Foothill Meat Company, Inc.	Oroville	CA	-121.504	39.483
P45910	Sanderson Farms, Inc.	St Pauls	NC	-79.013	34.829
P45911	Meridian Meat Packers	Meridian	ID	-116.391	43.626
P45912	Feather Road Poultry Processing	Knox City	MO	-91.967	40.199
P45918	KBBQ Meat Company	Downey	CA	-118.118	33.92
P45919	Circle C Farm Abattoir & Butcher Shop, LLC	Felda	FL	-81.451	26.553
P4592	Treasure Isle Foods	Mineola	NY	-73.638	40.742
P45925	Frigopack USA Inc	Elizabeth	NJ	-74.197	40.672
P45932	Productos Dany Inc.	Hatillo	PR	-66.799	18.374
P45942	Synear Foods USA, LLC	Chatsworth	CA	-118.6	34.244
P45945	Home Place Pastures	Como	MS	-89.862	34.507
P45951	Morris Meat Plant 1239	Morris	IL	-88.438	41.39
P45960	It's All About You Catering / Simple Bites	Meridian	ID	-116.412	43.606
P45963	The Original Crunch Roll Factory, LLC	Westfield	NY	-79.58	42.332
P45964	Jamaican Flavors Patties, Inc.	Jamaica	NY	-73.773	40.66
P45977	Out of the Shell dba Yangs or Lings	South El Monte	CA	-118.059	34.056
P45986	Brothers Quality Halal Meat, LLC	Paterson	NJ	-74.149	40.894
P45989	Processadora La Esperanza Inc.	Barranquitas	PR	-66.316	18.188
P45997	Brooke & Bradford LLC	Salt Lake City	UT	-111.971	40.753
P45999	The Meat Locker, LLC	Bend	OR	-121.265	44.055
P460	Jaindl Turkey Sales Inc	Orefield	PA	-75.58	40.643
P46002	Kanani Foods II, Inc.	Las Vegas	NV	-115.184	36.128
P46007	CJ Foods Manufacturing Corporation	Fullerton	CA	-117.888	33.867
P46009	CJ Foods Manufacturing Beaumont Corporation	Beaumont	CA	-116.996	33.928
P46013	Stanley Pearlman Enterprise	Jessup	MD	-76.782	39.156
P46013A	Stanley Pearlman Enterprises	Jessup	MD	-76.784	39.157
P46018	Shiners Stash Inc	North Wilkesboro	NC	-81.173	36.154
P46020	Lydia's Ladle, LLC	St. Louis	MO	-90.273	38.549
P46023	Wyoming Legacy Meats, LLC	Cody	WY	-109.057	44.544
P46025	Maverick Caterers, LLC	Hackensack	NJ	-74.051	40.88
P46027	Gold Creek Processing, LLC	Gainesville	GA	-83.858	34.27
P4602A	NEW MARKET POULTRY, LLC	NEW MARKET	VA	-78.67	38.647
P46031	Grand Taste Corporation	City of Industry	CA	-117.981	34.035
P46033	Hanoon Foods llc	Pomona	CA	-117.736	34.058
P46043	Goldbergs Commissary, LLC	Marietta	GA	-84.492	33.913
P46045	Colorado Green Chili, LLC	Colorado Springs	CO	-104.862	38.841
P46046	Roth Premium Foods, LLC	Colorado Springs	CO	-104.792	38.996
P46047	Prestige Farms	Atlanta	GA	-84.391	33.66
P46049	Cargill Meat Solutions	Round Rock	TX	-97.688	30.505
P4605	PDH Markets	Endicott	NY	-76.04	42.124
P46052	Ladyfingers Caterers/Ladyfingers Gourmet To Go	Raleigh	NC	-78.596	35.849
P46058	Great Lakes Pot Pies	Clawson	MI	-83.158	42.533
P4606	Hamilton Meats Supply Inc.	Pine City	NY	-76.859	42.041
P46064	Carmine's Frozen Pizza, LLC	Durham	CT	-72.68	41.467
P46065	Base Camp Operations	Monument	CO	-104.862	39.107
P46068	Horton's Quality Meats	Springfield	GA	-81.368	32.448
P46069	RED'S ALL NATURAL, LLC.	NORTH SIOUX CITY	SD	-96.499	42.541
P46072	Quality Pork International Inc. - West Point	West Point	NE	-96.713	41.839
P46075	Grayson Smokehouse LLC	Independence	VA	-81.128	36.622
P46084	Junction Produce & More	Junction City	KY	-84.795	37.587
P46085	Triad Halal Meats LLC	Madison	NC	-79.995	36.412
P46089	Caribbean Crescent Inc.	Baltimore	MD	-76.66	39.267
P46091	Ozark Mountain Poultry, Inc.	Batesville	AR	-91.643	35.762
P46099	West End Fresh Salads, LLC	Tupelo	MS	-88.701	34.204
P46103	Blue Ridge Meats	Rabun Gap	GA	-83.358	34.971
P46108	Bovine and Swine	Jackson	WY	-110.798	43.463
P4611	Hudson Foods Venture, LLC	Hudson	NY	-73.792	42.258
P46111	Kroll Farms Inc.	New Windsor	NY	-74.096	41.458
P46123	Max's Kitchen LLC	Modesto	CA	-120.983	37.611
P46125	California Rice Center Inc.	Gardena	CA	-118.314	33.879
P46132	Seven Hills Food LLC	Arcadia	CA	-118.008	34.101
P46139	Cypress Valley Meat Company	Pottsville	AR	-93.049	35.255
P46146	Ben's Best LLC	Bradenton	FL	-82.31	27.424
P46159	Columbus Meats, Inc.	Chicago	IL	-87.73	41.812
P46162	River Bear American Meats	Denver	CO	-104.953	39.77
P46169	Good To-Go, Inc.	Kittery	ME	-70.712	43.126
P46170	Quapaw Food Services Authority	Miami	OK	-94.804	36.919
P46172	JM Watkins, LLC	Maiden Rock	WI	-92.264	44.654
P46178	Northwest Gourmet Food Products, Inc.	Renton	WA	-122.226	47.474
P46180	World of Pies LLC	Norcross	GA	-84.209	33.936
P46183	C &S Poultry	Monterey Park	CA	-118.147	34.055
P46185	Detweiler Meats LLC	Crofton	KY	-87.487	37.047
P46194	Piazza Produce LLC, d/b/a Cibus Fresh	Noblesville	IN	-86.007	40.013
P46200	Caledonia Packing LLC	Caledonia	MI	-85.568	42.797
P46205	Dakota Provisions - West	Huron	SD	-98.253	44.366
P46213	Burgundy Pasture Poultry LLC	Hillsboro	TX	-97.055	31.952
P46223	SunOpta Foods, Inc.	Allentown	PA	-75.616	40.592
P46227	Nicola's Pasta Fresca, LLC	Kenilworth	NJ	-74.28	40.669
P46230	Greenfield Foods Corporation	Algona	WA	-122.247	47.293
P46231	Del Rey Meat & Seafood, Inc.	Anaheim	CA	-117.882	33.816
P46233	University of Wisconsin River Falls	River Falls	WI	-92.623	44.855
P46235	His Meat Company	Marshfield	WI	-90.179	44.631
P46236	F & S Fresh Foods	Conley	GA	-84.318	33.637
P46242	El Campestre Inc.	Compton	CA	-118.215	33.884
P46243	S.D.J. Trading Inc.	Irvington	NJ	-74.25	40.721
P46248	Slagel Family Meats, Inc.	Forrest	IL	-88.412	40.75
P46248A	Wabash Poultry Processing	Forrest	IL	-88.411	40.75
P4625	Ford Brothers Wholesale Meats Inc	West Valley	NY	-78.678	42.398
P46250	Lou G Siegel	Brooklyn	NY	-73.954	40.724
P46255	Gemstone Ventures dba RCF, LLC or Gemstone Foods	Florence	AL	-87.669	34.795
P46259	Taylor Farms Retail, Inc.	Gonzales	CA	-121.446	36.503
P46260	Meat Masters Processing Co.	Stockton	IL	-90.002	42.347
P46262	BillyDoe Meats, Inc.	Hoffman Estates	IL	-88.139	42.062
P46264	Link Snacks Inc.	Minneapolis	MN	-93.275	44.979
P46277	Brite Start, LLC.	Altura	MN	-91.942	44.07
P46281	Winly Foods LLC	Henderson	TX	-94.797	32.168
P46288	Kerry	Clark	NJ	-74.319	40.628
P4629	Isabelle's Kitchen, Inc.	Harleysville	PA	-75.383	40.277
P46292	Off the Rail Butchery	Blair	NE	-96.136	41.546
P46293	South Florida Food LLC	Hollywood	FL	-80.203	25.998
P46298	United Foods Corporation	Chicago	IL	-87.646	41.825
P46299	Pegasus Foods Inc.	Rockwall	TX	-96.425	32.913
P46301	Wagon Meats	El Paso	TX	-106.461	31.773
P46308	VT Pie and Pasta Co.	Newport	VT	-72.168	44.951
P46311	Victoria's Catering	Lynn Haven	FL	-85.649	30.246
P46312	Leroy Meats	Fox Lake	WI	-88.921	43.567
P46312B	Leroy Meats	Horicon	WI	-88.639	43.444
P46316	Harvesters - The Community Food Network	Kansas City	MO	-94.515	39.055
P46320	Reser's Fine Foods, Inc.	Topeka	KS	-95.615	39.046
P46321	Curt's Pork Skins	Breman	GA	-85.102	33.742
P46324A	Morning Star Poultry	Fort Plain	NY	-74.67	42.884
P46327	CF THK, LLC	Houston	TX	-95.325	29.704
P46334	Plymouth Meats, LLC	Terryville	CT	-73.022	41.689
P46336	Pioneer Meats, Inc.	Big Timber	MT	-109.918	45.838
P46337	Lepe's Meat Company Inc.	Santa Rosa	CA	-122.724	38.388
P46338	Allen Harim Foods, LLC	Millsboro	DE	-75.27	38.576
P46339	Tejas Premium Meats, LLC	Itasca	TX	-97.198	32.208
P46340	The Meat Market	Baraboo	WI	-89.72	43.472
P46341	HPP Food Services	Wilmington	CA	-118.276	33.772
P46344	JBS USA	Mason	OH	-84.303	39.374
P46345A	Henry Broch Foods	Waukegan	IL	-87.889	42.394
P46347A	Decko Products, Inc.	Sandusky	OH	-82.744	41.436
P46349	Cordele Cold Storage & Food Processing, LLC	Cordele	GA	-83.74	31.969
P46360	Connie's Pizza	Chicago	IL	-87.675	41.847
P46365	HB Foods, LLC	Lakewood	WA	-122.49	47.168
P46367	Raybern Foods LLC	Shannon	MS	-88.699	34.171
P46368	George Nottoli & Son	Chicago	IL	-87.819	41.938
P46373	Cargill Kitchens Solutions, Inc.	Big Lake	MN	-93.716	45.333
P46374	Sanderson Farms Processing Inc. Tyler Processing Division	Tyler	TX	-95.233	32.46
P46379	Peco Foods, Inc	West Point	MS	-88.664	33.594
P4638	Warsaw Packing Co.	Warsaw	NY	-78.129	42.701
P46381	The Vons Companies, Inc.	March Air Reserve Base	CA	-117.281	33.9
P46387	JNP Hawaii LLC	Honolulu	HI	-157.887	21.326
P46394	Wayne Farms LLC	Decatur	AL	-87.043	34.612
P46396	NutriFresh HPP Services LLC	Edison	NJ	-74.391	40.535
P46397	Bakkavor Foods USA, Inc - Charlotte Breads	Charlotte	NC	-80.948	35.115
P4640	Davis Bros. Inc.	Oswego	NY	-76.468	43.446
P46411	Pacific Fresh Premium Meat	Tacoma	WA	-122.434	47.25
P46419	Fitch Ranch Artisan Meat Company	Craig	CO	-107.543	40.507
P46421	Jack Mountain Meats LLC	Burlington	WA	-122.333	48.474
P46427	Rudy's Meat Provisioners, LLC	Portland	OR	-122.603	45.526
P46432	KD Latin Food Inc	Hialeah	FL	-80.292	25.838
P46434	Wahoo Locker LLC	Wahoo	NE	-96.622	41.21
P46435	First Street Cafe	Phoenix	OR	-122.816	42.274
P46437	Najla's Speciality Foods, Inc.	Louisville	KY	-85.608	38.261
P46442	Tejas Meat Processors	Houston	TX	-95.347	29.695
P46445	Bakkavor US - San Antonio	San Antonio	TX	-98.403	29.482
P46448	Forum Meat Company	Ennis	TX	-96.617	32.31
P46456	MawMaw's Chicken Pies	Kernersville	NC	-80.06	36.119
P46461	Global Gourmet Food Solutions LLC	Garland	TX	-96.691	32.902
P46463	Food Crafters, LLC	Florida	PR	-66.566	18.363
P46469	Capitol Concessions LLC	San Antonio	TX	-98.415	29.43
P46471	Tubito's Pizza, LLC	Oakland Park	FL	-80.142	26.173
P46475	Kurzweils Country Meats	Garden City	MO	-94.249	38.594
P46479	Fisher Packing Company	Redkey	IN	-85.166	40.345
P46481	Integra Foods, LLC	Bladenboro	NC	-78.774	34.554
P46483	Stormberg Foods LLC	Goldsboro	NC	-77.943	35.385
P46483A	Stormberg Foods LLC	Goldsboro	NC	-77.922	35.368
P46491	WholeStone Farms Cooperative, Inc.	Fremont	NE	-96.486	41.422
P46494	Magnolia Food Co., LLC	North Haven	CT	-72.868	41.343
P46498	Westminster Meat Packing, Inc.	Westminster	VT	-72.46	43.093
P46499	East West LLC	Landover	MD	-76.858	38.939
P465	MG Foods	Charlotte	NC	-80.948	35.125
P46507	US Cold Storage	McDonough	GA	-84.155	33.393
P4651	LaFrieda Meats Inc.	North Bergen	NJ	-74.038	40.78
P46514A	Love Snacks, LLC	Winter Garden	FL	-81.568	28.549
P46515	Vicky Enterprises, Inc.	Medley	FL	-80.316	25.843
P46516	Stryker Farm LLC	Saylorsburg	PA	-75.33	40.863
P4651A	LaFrieda Meats Inc.	North Bergen	NJ	-74.037	40.782
P4652	George E. Assadourian Inc.	Fairview	NJ	-73.994	40.818
P46521	Barrett's Smokehouse	Portage	MI	-85.615	42.172
P46522	Del Real Foods, LLC	Moore	OK	-97.484	35.347
P46523	NCF Foods, LLC	Marne	MI	-85.816	43.04
P46525	JD Meat Market	Bronx	NY	-73.925	40.842
P46527	Artisan Kitchens, LLC	Newberry	SC	-81.631	34.281
P4653	A.A. Rubashkin & Sons	Brooklyn	NY	-73.987	40.637
P46530	Voung Dim Sum Corporation	Doraville	GA	-84.27	33.897
P46538	Family Traditions Meat Company, Inc.	Ackley	IA	-93.058	42.557
P4653A	Agri Star Meat and Poultry, LLC	Postville	IA	-91.581	43.088
P46544	E.A. Sween Company	Annandale	MN	-94.1	45.255
P46549	Buttermilk Pie Company, LLC	Gainesville	GA	-83.842	34.282
P46553	Erie Bone Broth, LLC	Cleveland	OH	-81.678	41.508
P46563	madinatraders mar	Burr Ridge	IL	-87.939	41.74
P46578	Ram Country Meats	Fort Collins	CO	-105.082	40.572
P46579	Pelmeni Princess	Tahlequah	OK	-94.974	35.9
P4657A	Sun Ming Jan Inc.	Brooklyn	NY	-73.931	40.703
P46581	Richard's Cajun Foods	Church Point	LA	-92.203	30.412
P46583	McLane Classic Foods	Burleson	TX	-97.266	32.472
P46585	Leader Meat Packing Corp.	Chesterfield	NJ	-74.631	40.07
P46586	Gambino's Italian Eatery	Stratford	NJ	-75.006	39.835
P46591	Five Star Breaktime Solutions	Lafayette	GA	-85.276	34.736
P46594	DTF Prep Seattle, LLC	Seattle	WA	-122.335	47.567
P46603	Gold Creek Foods LLC/Gold Creek Processing LLC	Gainesville	GA	-83.859	34.269
P46606	Pineland Farms Natural Meats	New Gloucester	ME	-70.262	43.908
P46607	Fresh Express Incorporated	Morrow	GA	-84.347	33.562
P46612	Midwest Kitchens	Kenosha	WI	-87.893	42.591
P46616	Tudo Bom LLC	Elizabeth	NJ	-74.213	40.669
P46617	Tusan Commodities Inc	Lake City	GA	-84.343	33.61
P4662	Piatkowski Riteway Meats Inc.	Niagara Falls	NY	-79.015	43.129
P46624	Kibberia Foods LLC	Danbury	CT	-73.421	41.388
P46624A	Kibberia Foods LLC	Danbury	CT	-73.421	41.412
P46625	Los Mejores Tamales Production Corp.	Hialeah	FL	-80.262	25.848
P46637	Catskill Food Company LLC	Delhi	NY	-74.919	42.275
P46638	Taylor Farms New England Inc.	North Kingstown	RI	-71.44	41.605
P46644	Yellow Bowler Hat LLC	Spring	TX	-95.437	30.128
P46648	Amish Country Bakehouse	Carlisle	PA	-77.178	40.204
P46655	Bama Companies, Inc.	Tulsa	OK	-95.95	36.148
P46661	Miesfeld's Market	Sheboygan	WI	-87.771	43.798
P46662	Great Lakes Cheese Company, Inc. - Wausau, WI	Wausau	WI	-89.764	44.964
P46666	Maryland Packaging LTD	Halethorpe	MD	-76.675	39.254
P46672	Norman W. Fries	Sylvania	GA	-81.671	32.764
P46673	Triple Sticks Foods LLC	Belleville	IL	-90.056	38.574
P46684	Yushang Food Inc.	Spartanburg	SC	-81.968	34.915
P46689	Custom Cut Solutions	Albertville	AL	-86.184	34.255
P46690	Market House Meats	Northfield	MN	-93.291	44.505
P46691	Traditional Snacks	Hialeah Gardens	FL	-80.37	25.891
P46693	United Fruit and Produce Co.	St. Louis	MO	-90.191	38.652
P46693A	United Fruit and Produce Co.	St. Louis	MO	-90.189	38.653
P46696	American Country Foods, Inc.	Plainfield	CT	-71.88	41.686
P46697	Miami Desserts Corp.	Hialeah	FL	-80.333	25.896
P46706	Northeast Kingdom Processing LLC	St. Johnsbury	VT	-72.014	44.498
P46707	Hartland Abattoir Corp	Gasport	NY	-78.585	43.24
P46715A	Midway International Logistics LLC	Watertown	NY	-75.915	43.992
P46719A	New England Charcuterie, LLC	Waltham	MA	-71.199	42.384
P46723	Romano's Originals, LLC	Newtown Square	PA	-75.438	39.977
P46730	NGF Processing, LLC	Petal	MS	-89.106	31.237
P46734	Davis Meat Processing LLC	Jonesburg	MO	-91.297	38.861
P46737	Total Product Distributor Inc.	Brooklyn	NY	-73.917	40.642
P46743	Craftology, LLC dba Dutch Treat Foods	Zeeland	MI	-85.984	42.828
P46747	Ye Olde Kings Head, Inc.	Calabasas	CA	-118.639	34.158
P46758	US Quality Meats, LLC	El Paso	TX	-106.47	31.764
P46766	GC Food Factory LLC	Miami	FL	-80.315	25.796
P46777	Bob's Processing Inc.	South Haven	MI	-86.232	42.36
P46783	Chan and Chan USA, LLC	Bethlehem	PA	-75.428	40.65
P46788	Southeastern Mills, Inc.	Rome	GA	-85.199	34.17
P46794	Main Processing LLC	Detroit	TX	-95.266	33.662
P46798	Century Frozen Foods	Canovanas	PR	-65.9	18.372
P468	Peco Foods, Inc.	Batesville	AR	-91.649	35.765
P46808	Superior Sausage, LLC	District Heights	MD	-76.868	38.847
P46809	P & J Meat Market Corp	Newark	NJ	-74.178	40.718
P46810	International Blessed Foods, Inc.	Winston-Salem	NC	-80.264	36.071
P46816	Depalo Foods, Inc.	Belmont	NC	-81.055	35.268
P46818	World Class Kitchens-Freehold	Freehold	NJ	-74.24	40.251
P46819	Island Bwoy Cuisine, LLC.	Temple Hills	MD	-76.94	38.824
P46822	Mitchell's Meat Processing, LLC.	Walnut Cove	NC	-80.145	36.297
P46822A	Mitchell's Butchery, Inc	Walnut Cove	NC	-80.181	36.367
P46824	Fresh Halal Meat, Inc.	Lexington	NC	-80.199	35.765
P46826	SHENANDOAH VALLEY ORGANIC	Harrisonburg	VA	-78.866	38.46
P46826A	Shenandoah Valley Organic, LLC	Harrisonburg	VA	-78.856	38.469
P46828	Dean Street Processing	Bailey	NC	-78.104	35.778
P4683	Loke Enterprises, Inc.	King of Prussia	PA	-75.35	40.087
P46830	Mrs. Pumpkins Muffin's Inc.	Winston-Salem	NC	-80.318	36.159
P46833	Express Transfer and Trucking	Pennsauken	NJ	-75.053	39.97
P46834	Nuchas, LLC	North Bergen	NJ	-74.022	40.791
P46835	Megas Yeeros, LLC	Lyndhurst	NJ	-74.098	40.801
P4684	Whiteman Meat Processing	Dansville	NY	-77.706	42.562
P46841	Lakeside Refrigerated Services	Swedesboro	NJ	-75.376	39.75
P46849	Caribbean Breeze Frozen Foods Corp.	Pemberton	NJ	-74.687	39.969
P46850	Deluxe Foods International, Inc.	Paterson	NJ	-74.144	40.938
P46851	SLM Gyro & Donor, LLC	Springfield	NJ	-74.306	40.712
P46859	Mickenzie Jerky, Inc.	Hope Mills	NC	-78.963	34.983
P4686	Arctic Foods USA, LLC	Washington	NJ	-74.97	40.76
P46867	A & G Food Service LLC	Little Silver	NJ	-74.038	40.325
P46870	Butterball, LLC	Raeford	NC	-79.209	34.976
P46873	Quality Foods From The Sea	Elizabeth City	NC	-76.21	36.312
P46876A	Latin Goodness Foods	Rockville	MD	-77.142	39.098
P46877	Seven Hills Abattoir	Lynchburg	VA	-79.152	37.398
P46881	Kelly Turkeys USA, LLC	Crozet	VA	-78.752	38.074
P46894	MAGNOLIA BEEF HOLDINGS LLC	HASBROOK HEIGHTS	NJ	-74.071	40.85
P46897	IHSAN FARMS, IIC	PRINCESS ANNE	MD	-75.679	38.196
P46904	ARO Foods, LLC	Houston	TX	-95.465	30.004
P46909	S & J Food Sales LLC	Frederick	OK	-99.014	34.406
P4691	Hartford West Indian Bakery, Inc.	Hartford	CT	-72.67	41.79
P46910	B & R Meat Processing	Winslow	AR	-94.143	35.809
P46911	Cut Fruit Express, Inc	Inver Grove Heights	MN	-93.037	44.782
P46913	Nurture Life, Inc.	Bedford Park	IL	-87.794	41.773
P46915	Ali's Meats, L.L.C.	Stone Mountain	GA	-84.119	33.824
P46919	J'S & A'S Food Inc	Memphis	TN	-89.893	35.149
P4692	Latina Boulevard Foods, LLC	Cheektowaga	NY	-78.75	42.871
P46926	Samossa Bites	Long Island City	NY	-73.929	40.757
P46942	Maple Wind Farm	Richmond	VT	-72.97	44.41
P46944	Bostrom Farms, LLC	Stanley	NY	-77.104	42.858
P46945	Pane Vita LLC	Rochester	NY	-77.624	43.167
P46953	Fresh Advantage / Demakes Enterprises, LLC	Danvers	MA	-70.975	42.577
P46954	Premier Meat Processing LLC	Astoria	NY	-73.936	40.759
P46959	Brugusa LLC	North Miami Beach	FL	-80.16	25.918
P46965	Dinners On The Porch, LLC	Winston-Salem	NC	-80.245	36.082
P46966	Encore Sausage Company	Hyattsville	MD	-76.887	38.933
P46968	ICON Meals	Farmers Branch	TX	-96.835	32.928
P46970	307 Meat Company	Laramie	WY	-105.586	41.282
P46973	Zahran Import Export Wholesale Inc.	Long Island City	NY	-73.933	40.753
P46977	Marjo's Delight	Dededo	GU	144.833	13.506
P46979	West Coast Prime Meats, LLC	Brea	CA	-117.917	33.921
P46981	Andre's & Lana's Delicacies	Lakewood	CO	-105.11	39.71
P46987	F&S Produce West LLC	Clackamas	OR	-122.562	45.401
P46996	305 Pizza @ MIA LLC	Miami	FL	-80.253	25.808
P46997	Nepaley LLC	Chicago	IL	-87.779	41.916
P47010	Julias Columbian Food	Lilburn	GA	-84.137	33.895
P47014	Husker Meats LLC	Ainsworth	NE	-99.852	42.554
P47015	AHR Manufacturing Inc	Hialeah	FL	-80.293	25.846
P47016	Amick Farms LLC.	Ward	SC	-81.719	33.918
P47022	Alba Foods LLC	Houston	TX	-95.403	29.848
P47026	Gallucci's Fine Foods Inc.	Danbury	CT	-73.434	41.389
P47028	Midsouth Packers, LLC	Forsyth	GA	-83.954	32.968
P47029	DeBacker Family Dairy	Daggett	MI	-87.553	45.444
P47032	Heart O' Lakes Quality Meats	Pelican Rapids	MN	-96.086	46.584
P47036	Andoro LLC	St. Louis	MO	-90.189	38.653
P47037	Quality Steak Inc.	Voorhees	NJ	-75.011	39.852
P47039	QC Poultry	Montebello	CA	-118.114	34.007
P47043	Aliyans Global, Inc.	Franklin Park	IL	-87.854	41.919
P47046	Abuelito Corn Inc.	Butler	NJ	-74.341	41.003
P47049	Lifestyle Foods Inc.	Hanover	PA	-76.953	39.823
P47056	TC Provisions, Inc.	Farmingdale	NY	-73.452	40.728
P47059	CYRE, Inc., DBA Pika's Farm Table	Lake Katrine	NY	-73.994	41.988
P47061	Del Caribe Meat, Inc	Bronx	NY	-73.909	40.831
P47064	Co-Man of GA	Cumming	GA	-84.109	34.228
P47065	New Horizon Food, Inc.	Lorton	VA	-77.184	38.736
P47069	United Meat Market	El Paso	TX	-106.472	31.758
P47070	IPMF, LLC., d/b/a Naturpak	Janesville	WI	-89.013	42.633
P47081	Taylor Farms Tennessee North	Covington	KY	-84.525	39.019
P47082	Tawa Services, Inc.	Buena Park	CA	-118.021	33.867
P47087	Alexis Wholesale Distribution Inc.	Gardena	CA	-118.304	33.902
P47090	Pupusas San Miguel, LLC	Waller	TX	-95.934	30.056
P47092	MainLine Foods LLC	Marietta	GA	-84.493	33.914
P47095	Hess Meat Market Inc.	Muenster	TX	-97.368	33.654
P47096	Tampasta LLC	Clearwater	FL	-82.695	27.87
P47097	B'ALL Foods LLC	Opa Locka	FL	-80.252	25.892
P471	Bar-S Foods Co.	Clinton	OK	-98.962	35.51
P47104	Fort Worth Meat Packers LLC	Fort Worth	TX	-97.348	32.812
P47104B	Fort Worth Meat Packers LLC	Fort Worth	TX	-97.348	32.812
P47108	Lil Smokehouse, LLC	Hattiesburg	MS	-89.324	31.298
P47108A	Lil Smokehouse, LLC	Hattiesburg	MS	-89.322	31.299
P47112	Crunch Pak	Cashmere	WA	-120.472	47.521
P47126	High Country Meats	Raton	NM	-104.446	36.884
P47129	3 Fish, Inc	Gastonia	NC	-81.192	35.29
P47133	Produce Innovations	Norwalk	IA	-93.668	41.493
P47136	Batchline Solutions	Westampton	NJ	-74.848	40.017
P47137	LSG Sky Chefs	Coraopolis	PA	-80.235	40.496
P47138	GA ZABIHA FARMS Inc.	Braselton	GA	-83.757	34.129
P47142	Hempstead Foodservice Inc.	Hempstead	NY	-73.629	40.703
P47146	K&K International Inc.	Torrance	CA	-118.311	33.845
P47148	Bud Antle	Soledad	CA	-121.356	36.457
P47150	A Peach of a Party	Roswell	GA	-84.358	34.02
P47153	Ruga Rue Meat Snax, LLC	Altoona	PA	-78.404	40.469
P47154	Northwest Frozen	Des Moines	WA	-122.306	47.411
P47156	By The Pound Catering Corp.	Hialeah	FL	-80.288	25.848
P47158	Lawlers Southern Foods III LLC	Ardmore	AL	-86.866	34.98
P47161	Northern Wind, LLC	Fall River	MA	-71.12	41.746
P47162	Punto Rojo Empanadas Corp.	Hempstead	NY	-73.623	40.707
P47164	Salm Partners, LLC	Denmark	WI	-87.839	44.342
P47165	Lopez Foods, Inc.	Cherokee	IA	-95.562	42.73
P47167	Elburn Market, Inc. dba Ream's Meat Market	Elburn	IL	-88.473	41.89
P47170	Simply Fresh Market, LLC	Marietta	GA	-84.414	33.95
P47171	Fishtail Food Distributing	Fishtail	MT	-109.504	45.453
P47175	United Custom Foods, LLC	Lucama	NC	-78.013	35.591
P47181	Quality Cut Meats	Cascade	WI	-88.011	43.655
P47192	OFD Foods, LLC	Albany	OR	-123.107	44.618
P47196	Waldron Custom Meats	New Milford	PA	-75.796	41.867
P47197	Belen De La Cruz- Empanadas	Johns Creek	GA	-84.212	34.066
P47200	Star Valley Meat Block	Thayne	WY	-111.003	42.92
P47214	GW BEEF COMPANY LLC	Washington	OK	-97.478	35.106
P47216	In't Veld's Meat Market	Pella	IA	-92.916	41.407
P47219	Nichirei Sacramento Foods Corporation	West Sacramento	CA	-121.562	38.55
P4722	Nodine's Smokehouse, Inc.	Torrington	CT	-73.111	41.794
P47223	Cutting Edge Meat Company LLC	Leakesville	MS	-88.593	31.189
P47227	Clean Chickens and Co.	Elk River	MN	-93.549	45.32
P47227B	Clean Chickens and Co., LLC	Willmar	MN	-95.088	45.117
P47228	Riverson Foods, Inc.	City of Industry	CA	-117.926	34.001
P47233	Bessie's Inc.	Fairborn	OH	-84.008	39.838
P47236	RH Meat Company	Paramount	CA	-118.17	33.891
P47237	JSL Foods, Inc.	Los Angeles	CA	-118.192	34.058
P47238	Modu Food Service, Inc.	Vernon	CA	-118.2	33.997
P47240	Hormel Foods Operations, LLC	Papillion	NE	-96.125	41.153
P47247	Luckey Hospitality, LLC	Nashville	TN	-86.88	36.187
P47251	Genuine Meats LLC	Riverton	WY	-108.453	43.056
P47254	Shining Comb Poultry	Romulus	NY	-76.811	42.787
P47258	Cargill Meat Solutions Corporation	North Kingstown	RI	-71.463	41.603
P47263	Freshpoint Bix Produce Company, LLC	Little Canada	MN	-93.085	45.033
P47264	New Mexico's Best, LLC	Roswell	NM	-104.524	33.374
P47265	JBS Prepared Foods-Moberly Facility	Moberly	MO	-92.439	39.451
P47266	Prime Nosh LLC	North Las Vegas	NV	-115.185	36.196
P47267	Birdsboro Kosher Provisions LLC	Newark	NJ	-74.141	40.729
P47275	Lapids Korner, Inc.	Los Angeles	CA	-118.218	34.079
P47282	Top Notch Jerky LLC	Sugar City	ID	-111.753	43.878
P47285	Green Valley Foods	Devils Lake	ND	-98.873	48.095
P47287	Project Meats LLC	Billings	MT	-108.358	45.902
P47287A	Ranch House Snacks	Billings	MT	-108.433	45.804
P47297	Cuisine Solutions	San Antonio	TX	-98.429	29.34
P47300	Fairway Market Distribution Center	Bronx	NY	-73.906	40.805
P47307	Shahs Halal New Horizons Processing, Inc.	Amityville	NY	-73.396	40.705
P47308	Wilde Brands	Winchester	KY	-84.216	38.015
P47308R	Wilde Brands	Winchester	KY	-84.191	38.013
P47311	Captain Reds, Inc.	Vernon	CA	-118.235	33.997
P47315	Burrito Bro's	Centralia	WA	-122.956	46.695
P47316	Peer Foods - Edinburgh	Edinburgh	IN	-85.957	39.313
P47320	Central Wyoming College	Riverton	WY	-108.423	43.036
P47321	King Ge, LLC	Tukwila	WA	-122.248	47.45
P47322	Positive Food Co.	Los Angeles	CA	-118.263	33.984
P47323	Natures Way Food Corp	Bronx	NY	-73.887	40.807
P47326	Creation Gardens	Denver	CO	-104.991	39.789
P47330	Best Stop Cajun Food, LLC	Scott	LA	-92.109	30.261
P47333	Three Lakes Ranch	Knoxville	GA	-83.945	32.698
P47336	Godshall's Quality Meats, Inc.	Souderton	PA	-75.356	40.28
P4734	New Lee's Live Poultry Market Inc.	BROOKLYN	NY	-73.936	40.707
P47343	Jallos LLC	Marysville	WA	-122.176	48.118
P47344	Quality Seafood & Poultry, Inc.	Biloxi	MS	-88.892	30.403
P47350	B&G Pacific, LLC	Tamuning	GU	144.782	13.496
P47386	Corfini Gourmet	Brisbane	CA	-122.417	37.689
P4739	RC Fine Foods	Hillsborough	NJ	-74.642	40.495
P47390	Millenia Foods LLC	Orlando	FL	-81.372	28.469
P47394	Poultry Processing of Atlanta	Loganville	GA	-83.878	33.833
P47396	Eat Catering Concepts, LLC	Duluth	GA	-84.165	34.016
P47402	Avatar Foods, Inc.	Henderson	NV	-114.958	36.016
P47404	Meat & Dough Foods LLC	Schaumburg	IL	-88.061	42.067
P47406	Mutual Trading Co., Inc.	El Monte	CA	-118.047	34.086
P47409	Hertzog Meat Co. South LLC	Butler	MO	-94.351	38.256
P47409A	Hertzog Premium Beef LLC	Butler	MO	-94.35	38.323
P47417	Timeline Trading	Auburn	WA	-122.226	47.338
P47418	Knights Butchering & Processing, LLC	Keysville	GA	-82.223	33.16
P47423	FW Logistics- Montezuma Cold Facility	Montezuma	GA	-84.009	32.298
P47424	Hoyo, SBC	Minneapolis	MN	-93.261	44.949
P47426	Hodges	Tulsa	OK	-95.875	36.179
P47428	Tuscany South, LLC	Bartlett	TN	-89.825	35.205
P4743	Nicolosi Foods Inc.	Union City	NJ	-74.037	40.768
P47435	Valeria's Kitchen, LLC	Fitchburg	MA	-71.777	42.567
P47439	Indian Creek Meats	Poplar Bluff	MO	-90.357	36.863
P47441	Kartveli LLC	Monroe Township	NJ	-74.388	40.38
P47445	Piedmont BBQ Company LLC	Atlanta	GA	-84.265	33.887
P47452	Glatt Organics LLC	Englewood	NJ	-73.982	40.887
P47462	Colorado Food Enterprises Inc.	Denver	CO	-104.975	39.771
P47463	Patty Pan Cooperative	Shoreline	WA	-122.299	47.743
P47465	Imperial Foods	Sacramento	CA	-121.474	38.655
P47472	Pure Pasture Packing, LLC	Sedalia	MO	-93.141	38.688
P47473	Rovagnati North America LLC	Vineland	NJ	-75.068	39.508
P47482	El Rodeo Diced Meats Inc.	Salem	OR	-123.003	44.972
P47484	The Durand Smokehouse LLC	Durand	WI	-91.939	44.64
P47486	Ranchers Processing Inc.	Mendota	CA	-120.373	36.758
P47487	Shahnawaz Foods LLC	Middlesex	NJ	-74.487	40.574
P47491	DC Meat Inc	Duchesne	UT	-110.216	40.172
P4750	Giovanni Veal, Inc.	Woburn	MA	-71.118	42.477
P47503	King Street Pizza Company	Elk Grove Village	IL	-87.978	42.031
P47509	Commissary Azteca	Lodi	CA	-121.272	38.126
P47512	Houston Food Bank	Houston	TX	-95.275	29.781
P47515	Agile Cold ATL NW, LLC	Cartersville	GA	-84.874	34.222
P47516	Winchester Cold Storage	Winchester	VA	-78.152	39.198
P47518	Zimmerman Meats LLC	Summersville	MO	-91.715	37.197
P47519	Carbone's Pizzeria	River Falls	WI	-92.63	44.847
P47523	TPM Foodservice LLC	Solon	OH	-81.467	41.381
P47529	Sustainable Meats LLC	Kuna	ID	-116.249	43.419
P4753	Gene Wenger's Meats & Fine Foods	Elizabethtown	PA	-76.583	40.149
P47531	Wet Noses Natural Dog Treat Co. LLC	Monroe	WA	-122.006	47.866
P47534	Agile Cold ATL NE, LLC	Gainesville	GA	-83.753	34.236
P47535	Pinnacle Foods Co.	High Point	NC	-80.033	35.948
P47536	European Food Factory LLC	Livonia	MI	-83.355	42.441
P47540	Premier Freeze Dry	West Haven	UT	-112.026	41.206
P47542	Knauss Foods	Quakertown	PA	-75.32	40.423
P47543	Swift Pork Company	Worthington	MN	-95.656	43.559
P47552	Kitchen Majgek LLC	Lafayette	LA	-92.072	30.231
P47558	Allen Brothers	Opa-Locka	FL	-80.291	25.906
P47560	John Soules Foods, Inc.	Valley	AL	-85.177	32.781
P47561	Fresh Ideas Co., Inc.	Charlestown	MA	-71.074	42.378
P47565	Lineage Logistics, LLC	Joliet	IL	-88.026	41.506
P47579	Tyson Foods Inc.	Humboldt	TN	-88.926	35.851
P47581	Foodland Super Market, Limited	Waipahu	HI	-158.024	21.376
P47586	Fimus Limited	Luray	VA	-78.452	38.666
P47591	Custom Craft Poultry	Little Rock	AR	-92.324	34.72
P47592	North Bay Butchers, LLC	Petaluma	CA	-122.576	38.279
P47592A	North Bay Butchers, LLC	Marshall	CA	-122.825	38.15
P47596	Food Fusion NJ LLC	Bridgeton	NJ	-75.221	39.424
P47597	Royalty Meats & Poultry, LLC	Rockaway	NJ	-74.518	40.895
P47599	Niagara Food Specialties USA, Inc.	Lyndonville	NY	-78.465	43.346
P476	Pilgrim's Pride Corporation	Carrollton	GA	-85.09	33.596
P47600	Arizona Beef LLC	Tucson	AZ	-110.957	32.179
P47604	QBANS, CORP	Naranja	FL	-80.411	25.518
P47617	DUTCH MILL CATERING T/A TORN APRON FOODS	Brentwood	MD	-76.953	38.943
P47618	Second Harvest Heartland	Brooklyn Park	MN	-93.383	45.084
P47620	Venice Bakery	Hamden	CT	-72.925	41.36
P47624	Daniels Gourmet Meats	Bozeman	MT	-111.042	45.7
P47629	Soulshine Farms, LLC	Gainesville	GA	-83.86	34.267
P47631	Adam's Sausage Factory	Rancho Cordova	CA	-121.258	38.609
P47633	Prairie Smokehouse Partners	Springfield	IL	-89.584	39.837
P47639	Restaurant Consulting Group LLC	Mission	TX	-98.326	26.229
P47641	Concession Service Systems, Inc.	Miami	FL	-80.346	25.768
P47667	Fayman & Sorbello Food Group LLC	Madill	OK	-96.762	34.09
P47681	Gap View Homestead, LLC	Kinzers	PA	-76.018	39.975
P47683	Presto Foods Corp.	Doral	FL	-80.351	25.791
P47685	Bonfire Burritos LLC	Golden	CO	-105.178	39.724
P47693	Hugo Trading, Inc.	Gardena	CA	-118.303	33.912
P47694	Noujaim's Food, LLC	Winsted	CT	-73.072	41.921
P47697	Pure Cut Poultry	Hardeeville	SC	-81.079	32.297
P47708	Yankee Trader Seafood, Ltd., DBA Emma-Leigh & Co.	Hingham	MA	-70.92	42.163
P47709	Greeley Smokehaus & Meats	Braham	MN	-93.066	45.74
P4771	B & M Philly Steaks, Inc.	Harleysville	PA	-75.405	40.275
P47710	Black River Meats	Withee	WI	-90.638	45.064
P47716	Tennessee Grass Fed LLC	Clarksville	TN	-87.146	36.457
P47720	Pitcock Meat Processing Inc.	Pope	MS	-89.827	34.199
P47734	Compass Group USA, Inc. DBA MG Foods	Lenexa	KS	-94.764	38.952
P47739	Jackson Manufacturing LLC dba Bear State Kitchen	El Segundo	CA	-118.405	33.918
P47746	Josefa LLC	Elizabeth	NJ	-74.213	40.645
P47749	Tucson Tamale Wholesale Company LLC	Tucson	AZ	-110.97	32.2
P47750	Marceh Banjul U.S.A.	Lithonia	GA	-84.076	33.774
P47756	Theos's Distribution LLC dba Mama's Makings LLC	Detroit	MI	-83.181	42.444
P47760	Rome Sausage	Golden	CO	-105.178	39.724
P47762	Fayman & Sorbello Food Group LLC	Madill	OK	-96.762	34.09
P47764	Pasta Acquisition LLC	Saint Louis	MO	-90.222	38.593
P47775	Falls Meat Service Inc.	Pigeon Falls	WI	-91.21	44.426
P47784	Old North State Artisans, LLC.	Asheville	NC	-82.548	35.602
P47785	Babynov USA, LLC	Red Boiling Springs	TN	-85.865	36.529
P47793	Wycliff Douglas Provisions	Mesquite	TX	-96.672	32.789
P47797	Outback Premium Meats LLC	Forreston	IL	-89.578	42.126
P47798	Best Deal Brokerage LLC	Vernon	CA	-118.183	34.0
P4780	Premio Foods Inc.	Hawthorne	NJ	-74.154	40.96
P47805	New Hira Farm LLC	Tomball	TX	-95.73	30.04
P47807	Upside Foods, Inc.	Emeryville	CA	-122.294	37.843
P47808	Evermade Foods LLC	Warrenton	VA	-77.679	38.75
P47818	Short Creek Meats, LLC	Kennebunk	ME	-70.559	43.405
P4782	Jimmy E, Inc.	Brooklyn	NY	-74.022	40.647
P47824	Regenerative Agriculture Alliance	Stacyville	IA	-92.786	43.446
P47825	Mesa Foods	Rancho Cucamonga	CA	-117.55	34.105
P47826	J-H Cattle Co. & Meat Store	Joplin	MO	-94.498	37.092
P47827	Salt + Smoke	Maryland Heights	MO	-90.434	38.708
P47835	Service Meat Distributors, LLC	Stone Mountain	GA	-84.183	33.828
P47836	Vertical Cold Storage, LLC	Bolingbrook	IL	-88.129	41.663
P47839	Catalyst Foods	Sumner	WA	-122.222	47.203
P47843	Diamond State Meats, LLC	Rehoboth Beach	DE	-75.099	38.711
P47844	Obalende Foods, LLC	Redlands	CA	-117.218	34.061
P47847	Taiba LLC	Conyers	GA	-84.062	33.692
P47848	Wilson's Meats, LLC.	Traverse City	MI	-85.583	44.733
P47852	Farmstead Butcher Block LLC	Central City	KY	-87.107	37.244
P47854	Indiana Meat and Poultry Processors Inc	LaGrange	IN	-85.535	41.655
P47856	Ludington Meat Company	Ludington	MI	-86.375	43.955
P4786	U. S. Beef Inc.	Beltsville	MD	-76.913	39.028
P47861	Vermont's Farmhouse Jerky Co.	Essex Junction	VT	-73.067	44.51
P47864	Salumi Chicago, Inc	Chicago	IL	-87.69	41.808
P47865	Ayam Yook LLC	Moonachie	NJ	-74.07	40.838
P47867	Divine Meats, Inc.	Ferris	TX	-96.648	32.584
P47868	Houston Sausage Inc.	Houston	TX	-95.58	29.705
P47879	Looped Square Meat Company	Beggs	OK	-96.015	35.81
P4788	Rock Run Butchering Company, LLC	Newville	PA	-77.417	40.24
P47880	Highland Farm Fresh LLC	Grantsville	MD	-79.128	39.719
P47882	Circle M Meats	Monett	MO	-93.909	36.928
P47884	Giordano's	Chicago	IL	-87.626	41.896
P47886	Blair Meat Market LLC	Blair	WI	-91.239	44.291
P47889	The Real Good Foods Company, LLC	Bolingbrook	IL	-88.091	41.67
P47893	Alex Meats, Inc.	Chicago	IL	-87.625	41.772
P47905	JBS Prepared Foods	Columbia	MO	-92.276	39.003
P47910	Meat King, Inc.	Brooklyn	NY	-74.005	40.685
P47918	Hanzlian's Sausage & Deli	Cheektowaga	NY	-78.796	42.919
P47921	Wright's Meat Processing INC.	Summerville	GA	-85.212	34.53
P47927	Spray-Tek LLC	Beloit	WI	-88.968	42.511
P47928	Midwest Meat Company	Minden	NE	-98.933	40.503
P47936	Easton Meat Services, Inc.	Easton	PA	-75.211	40.673
P47937	US Meat Processing, LLC	Astoria	NY	-73.901	40.777
P47939	NY Delicacy Inc.	Fresh Meadows	NY	-73.788	40.727
P47945	Puro Alentejano Iberian Hog Corp	Salem	NJ	-75.405	39.538
P47954	Arlington Valley Farms	Hudson	OH	-81.449	41.209
P47956	Volo Packing & Market	Volo	IL	-88.161	42.325
P47961	3333 Foods	Roseville	IL	-90.748	40.664
P47963	The Butcher Shop, Inc.	Oakes	ND	-98.097	46.134
P47971	Ajinomoto Foods North America	Joplin	MO	-94.396	37.056
P47972	Lou Malnati's Priority Pizza, LLC	Buffalo Grove	IL	-87.939	42.172
P47974	Crystal Freeze Dry	Panora	IA	-94.362	41.687
P47975	Ascent Foods, LLC	Laredo	TX	-99.511	27.552
P47981	Carolina Precision Foods, LLC	Florence	SC	-79.809	34.196
P47987	Jive Turkey's LLC	Greensboro	NC	-79.804	36.021
P47988	The Meat Pointe LLC	Garfield	NJ	-74.11	40.875
P4799	Mastroianni Food Distributor	Amsterdam	NY	-74.173	42.931
P47990	Patagonia Flavors	Miami	FL	-80.241	25.796
P47991	Compass Group USA	Oak Creek	WI	-87.919	42.857
P47993	Mason Hills LLC	Grand Bay	AL	-88.318	30.451
P47994	Saporicalabresi	Salem	NJ	-75.379	39.598
P4800	Eddy Packing Co., Inc.	Yoakum	TX	-97.141	29.312
P48066	Route 66 Meat Processing	Sayre	OK	-99.647	35.252
P48082	California Farms Meat Company Inc.	Vernon	CA	-118.205	34.003
P48087	Marin Sun Farms, Inc.	Petaluma	CA	-122.647	38.251
P48088	Reams Family Foods, Inc.	Hudson	WI	-92.743	44.964
P48089	Bright People Foods, Inc.	Woodland	CA	-121.743	38.679
P48094	Protein Provisioners, LLC	Arden Hills	MN	-93.15	45.056
P48095	Walke Brothers Meat Processing	Claremore	OK	-95.654	36.265
P48097	Yosemite Valley Beef Distributors	Los Angeles	CA	-118.215	34.016
P48098	Mistica Foods	Addison	IL	-87.991	41.916
P48098E	Mistica Foods LLC	Franklin Park	IL	-87.91	41.944
P48098M	Mistica Foods LLC	Addison	IL	-88.034	41.918
P48098N	Mistica Foods LLC	Franklin Park	IL	-87.901	41.942
P481	Tyson Foods, Inc.	Springdale	AR	-94.135	36.202
P48104	East Mountain Dumplings, Inc.	San Diego	CA	-117.139	32.894
P48108	People's Meats LLC	Stevens Point	WI	-89.445	44.515
P48109	Star Natural Meats LLC	Astoria	NY	-73.903	40.771
P48110	Ruth Premium Meat, LLC	Queen City	MO	-92.561	40.41
P48111	Weaver Meat Processing LLC	Hartselle	AL	-86.997	34.37
P48114	Vesar Foods LLC	Brookshire	TX	-95.945	29.781
P48119	Custom Craft Poultry	Batesville	AR	-91.622	35.791
P48120	AdvancePierre Foods, Inc	Caseyville	IL	-90.056	38.61
P48121	Haines Farming and Meat Processing	Gibbon Glade	PA	-79.637	39.73
P48130	GFP Processors, LLC	Ingram	TX	-99.238	30.076
P48132A	Goodwell Foods, LLC	Pittsfield	NH	-71.33	43.305
P48136	Wei-Chaun U.S.A. Inc	Murfreesboro	TN	-86.399	35.835
P48141	Halperns' Steak and Seafood Company, LLC	Grand Prairie	TX	-97.043	32.787
P48154	Mezban Foods	Dallas	TX	-96.894	32.818
P48156	Baily Meat LLC	Las Vegas	NV	-115.198	36.079
P48157	Del Barrio Foods, LLC.	Lockport	IL	-87.993	41.579
P48158	Northwest Meat Company	Chicago	IL	-87.665	41.888
P48159	Regional Food Bank of Oklahoma	Oklahoma City	OK	-97.615	35.431
P48176	Tampa Bay Fisheries, Inc.	Dover	FL	-82.237	27.992
P48183	IPMF, LLC., dba Naturpak	Janesville	WI	-88.955	42.674
P48189	Shaw's Soutthern Belle frozen Foods, Inc	Jacksonville	FL	-81.639	30.385
P48196	Anna's Kitchen, Inc.	Woburn	MA	-71.146	42.514
P48200	Stoltzfus Kitchen	Chuckey	TN	-82.65	36.183
P48201	Wang Cai Enterprise, Inc.	Sunnyside	NY	-73.926	40.742
P48204	Kingsland Food Processing Corp.	Maspeth	NY	-73.92	40.72
P48209	Wholesum Foods, LLC	South El Monte	CA	-118.035	34.048
P48210	Kentucky Meat Smith LLC	Science Hill	KY	-84.634	37.193
P48213	Junior's Smokehouse Processing Plant	El Campo	TX	-96.251	29.196
P48219	Panola County Processing LLC	Carthage	TX	-94.269	32.104
P48223	Tamales Los Mayas LLC	Hayward	CA	-122.119	37.647
P48225	Afia Foods	Taylor	TX	-97.481	30.571
P48227	Artisan Chef Manufacturing Company DBA: Tuscan Market	Lawrence	MA	-71.171	42.7
P48230	Panna Manufacturing LLC	Miami	FL	-80.197	25.944
P48233	Flying Food Group LLC	Vernon	CA	-118.209	34.009
P48234	Off The Dock Seafood, LLC	Memphis	TN	-89.946	35.042
P48235	Crescent Specialty Foods, LLC	Farmingdale	NY	-73.413	40.754
P48255	WURST MACHERS LLC	MORRIS	MN	-95.893	45.5
P48257	Journeyman Meat Company	Cloverdale	CA	-123.004	38.787
P48258	F&S Produce West LLC dba F&S Fresh Foods	Riverside	CA	-117.301	33.932
P48267	BUSTER RINDS LLC	Jackson	MS	-90.18	32.291
P4827	La Espanola Meat, Inc.	Harbor City	CA	-118.291	33.797
P48270	Patriot Meat Processing	Ona	WV	-82.174	38.447
P48272	Inland Seafood-Birmingham D.B.A. American Butcher Company	Birmingham	AL	-86.904	33.507
P4828	A.I. Foods Corporation	Los Angeles	CA	-118.197	34.064
P48281	White Lake Foods, LLC	Ferndale	NY	-74.741	41.753
P48285	A Butchery Shoppe	Spring Valley	WI	-92.238	44.843
P48286	Yassine Halal Food Corp	Astoria	NY	-73.935	40.759
P48287	Quality Custom Meats, LLC	Howard	SD	-97.52	44.008
P48291	Food Processing and Innovation Center (FPIC)	Okemos	MI	-84.455	42.679
P48297	Dave's Supermarket	Fairbury	IL	-88.514	40.746
P48298	A Farm Inc.	South El Monte	CA	-118.039	34.047
P48304	Lincoln Premium Poultry	Fremont	NE	-96.486	41.419
P48308	J-Bar Poultry Processing, LLC	New Plymouth	ID	-116.824	43.976
P4831	C&H Meat Co.	Vernon	CA	-118.214	34.009
P48314	Midwest Kitchens, LLC	Erie	PA	-80.08	42.141
P48315	Safety Fresh Foods LLC	Plymouth	WI	-87.973	43.739
P48317	Bednar Meats Inc. (DBA-Custom Foods)	Chicago	IL	-87.651	41.812
P4837	Oberto Snacks Inc.	Kent	WA	-122.283	47.388
P4838	The Butcher Block Meats	San Diego	CA	-117.137	32.696
P4846	Heatherfield Foods LLC	Moreno Valley	CA	-117.287	33.924
P48465	Meat Science and Animal Biologics Discovery	Madison	WI	-89.419	43.076
P48466	Al-Kawthar Poultry, LLC	Stevens	PA	-76.19	40.243
P4847	Win Fat Food LLC	Monterey Park	CA	-118.151	34.053
P48471	Soulshine Farms LLC	Gainesville	GA	-83.786	34.333
P48476	Saigon Kitchen LLC	Norcross	GA	-84.192	33.919
P486	Simmons Prepared Foods, Inc.	Siloam Springs	AR	-94.532	36.184
P4860	Stafford  Meat Company, Inc.	Rio LInda	CA	-121.43	38.698
P4863	Independent Meat Company	Twin Falls	ID	-114.443	42.533
P4871	Golden Eagle Services	South Gate	CA	-118.224	33.962
P4872	Modern Meat, Inc	San Bernardino	CA	-117.256	34.136
P4873	Commercial Meat Company, Inc.	Pico Rivera	CA	-118.114	33.975
P4876	Luck Nabeshima	Montebello	CA	-118.118	34.009
P4881	Double S Meats	Tonasket	WA	-119.448	48.697
P4891	Colorado Premium Foods	Greeley	CO	-104.681	40.405
P4894	Apple Valley Farms Inc.	Fresno	CA	-119.789	36.759
P4896	Elizabeth Locker Plant, Inc.	Elizabeth	CO	-104.596	39.362
P49	Campbell Soup Company	Camden	NJ	-75.108	39.941
P4907	Hearthside Food Solutions LLC d/b/a Maker's Pride	Salt Lake City	UT	-112.03	40.779
P4911	Al's Wholesale Meats, Inc.	Montebello	CA	-118.122	34.001
P4912	H. F. Meats, Inc.	La Crescenta	CA	-118.241	34.224
P4928	Islamic Meat & Poultry Co.	Stockton	CA	-121.275	37.941
P4933	American Outdoor Products, Inc	Boulder	CO	-105.206	40.07
P4934	T & J Sausage Kitchen	Anaheim	CA	-117.871	33.856
P4940	Meat Production Inc.	Kalispell	MT	-114.307	48.172
P4943	Sweety Novelty, Inc.	Torrance	CA	-118.299	33.856
P4968A	Great Western Meats	Las Vegas	NV	-115.094	36.237
P4969	JJ Meats Company	Madera	CA	-120.084	36.83
P4972	R&R Quality Meat Inc.	Anderson	CA	-122.361	40.492
P4976	RMFF Holdco LLC	Englewood	CO	-105.009	39.665
P4985	Modesto Food Distributors, Inc.	Hayward	CA	-122.05	37.616
P4989	K&M Meat Packing Co., Inc.	Vernon	CA	-118.229	34.013
P4993	Whiskey Hill Smokehouse LLC	Hubbard	OR	-122.806	45.181
P500K	Land O'Frost, Inc.	Madisonville	KY	-87.551	37.356
P501	Land O'Frost, Inc	Searcy	AR	-91.728	35.239
P502	OFD Foods LLC	Albany	OR	-123.111	44.614
P5057	The Alpine Wurst & Meat House	Honesdale	PA	-75.218	41.551
P5067	Kingsland Meat Distributors Inc.	Woodland Park	NJ	-74.193	40.906
P5070	Quality Food Company	West Warwick	RI	-71.507	41.67
P5072	Amazon Foods, Inc.	Chicopee	MA	-72.61	42.144
P5073	Cesina Sausage Co.	Aliquippa	PA	-80.261	40.614
P50789	Monogram Gourmet	Medford	MA	-71.081	42.414
P50790	Southern Cuts Processing, LLC	Pitts	GA	-83.579	31.955
P50792	Cali Dumpling	South El Monte	CA	-118.057	34.047
P50793	Tamarack Foods, LLC	Americus	GA	-84.199	32.12
P50804	Koehler's Meat and Sausage Company	Gillette	WY	-105.484	44.248
P50806	Fanny Food Peruvian Corp.	Hialeah	FL	-80.332	25.896
P50808	Molinas Provision	Everett	MA	-71.051	42.393
P50810	Alki Bakery Inc.	Kent	WA	-122.223	47.431
P509	Koch Foods LLC	Morristown	TN	-83.306	36.206
P5097	Bayside Foods, Inc.	PROVIDENCE	RI	-71.42	41.844
P509K	Smithfield Packaged Meats Corp.	Kansas City	MO	-94.598	38.877
P509L	Smithfield Packaged Meats Corp.	Lincoln	NE	-96.717	40.812
P510	House Of Raeford Farms	Rose Hill	NC	-78.033	34.859
P5101	Master Purveyors, Inc.	Bronx	NY	-73.872	40.807
P5107	Chef's Choice Cash & Carry Food Distribution Inc	Brooklyn	NY	-73.93	40.647
P511	Butterball, LLC	Ozark	AR	-93.818	35.485
P51173	Urth Hawthorne Commissary, LLC	Hawthorne	CA	-118.364	33.897
P51174	Synergy Flavors Innova LLC	Chicago	IL	-87.662	41.827
P51174A	Synergy Flavors lnnova, LLC	Chicago	IL	-87.652	41.815
P51179	Sanderson Farms, Inc.	Palestine	TX	-95.7	31.729
P51182	Symrise Inc.	Elyria	OH	-82.128	41.406
P51184	Bauman's Butcher Block	Ottawa	KS	-95.294	38.522
P51192	Table 87 Frozen, LLC	Brooklyn	NY	-74.013	40.654
P51195	Zetlian Bakery, Inc	Sun Valley	CA	-118.37	34.202
P51200	Blossom Foods, LLC	Oakland	CA	-122.288	37.82
P51204	New York Beef Company, LLC	Poughkeepsie	NY	-73.802	41.653
P51205	BrucePac	Durant	OK	-96.349	33.997
P51207	Daily's Premium Meats, LLC	St. Joseph	MO	-94.873	39.718
P51212	Dongsuh Inc.	Maywood	CA	-118.192	33.995
P51218	OSI Industries, LLC	Riverside	CA	-117.315	34.002
P5122	Weichsel Beef	Brooklyn	NY	-74.011	40.679
P51228	Adams Turkey Farm	Westford	VT	-73.057	44.591
P51234	Santora Foods LLC	Depew	NY	-78.727	42.91
P51237	OSI Industries, LLC	Chicago	IL	-87.665	41.817
P51240	Richelieu Foods Inc	Wheeling	IL	-87.92	42.111
P51243	Shaw Bakers, LLC	South San Francisco	CA	-122.407	37.639
P51243A	Shaw Bakers LLC	San Leandro	CA	-122.171	37.694
P51245	Evangel International Foods	Pasadena	TX	-95.206	29.672
P51248	MG Foods	Longview	TX	-94.712	32.491
P51252	La Belle Farm, Inc.	Scott Township	PA	-75.588	41.574
P51253	Total Packaging	Owensboro	KY	-87.121	37.724
P51255	Natural State Processing	Clinton	AR	-92.458	35.568
P51256	LaGustosa Food Products & Imports Co., Inc.	Franklin Square	NY	-73.683	40.697
P51257	MRK Foods, Inc.	Roscoe	IL	-89.011	42.398
P51261	Mercado Meat Distribution	Willows	CA	-122.194	39.526
P51263	Stamford Smokehouse LLC	Stamford	NY	-74.617	42.408
P51269	Golden Gourmet, LLC	Americus	GA	-84.206	32.114
P51278	Sea Watch International, Ltd	Easton	MD	-76.069	38.796
P51279	Encore Seafoods, Inc.	Sparks	NV	-119.748	39.532
P51282	Foods On The Fly LLC	San Diego	CA	-117.17	32.886
P51290	Bahar, LLC	Clifton	NJ	-74.138	40.877
P51291	Prime Foods, LLC	Boonville	IN	-87.307	38.046
P51295	SK Food Group	Tolleson	AZ	-112.222	33.442
P513	Carl Buddig and Co	South Holland	IL	-87.619	41.595
P51300	Phillips Meats LLC	Zanesville	OH	-82.051	39.932
P51302	Belmont Meats, LLC	Paradise	PA	-76.112	39.991
P51308	Miniat Foods LLC	Carrollton	GA	-85.097	33.611
P51310	Fresh Food TOGO Inc.	Cincinnati	OH	-84.454	39.225
P51315	Clean Eatz Kitchen	Wilmington	NC	-77.84	34.262
P51315A	CE Kitchen LLC	Wilmington	NC	-77.933	34.183
P51315B	Clean Eatz Kitchen	Salt Lake City	UT	-112.024	40.731
P51315C	Clean Eatz Kitchen	Maryland Heights	MO	-90.469	38.751
P51316	Out Of The Shell	South El Monte	CA	-118.057	34.047
P51317	Oasis Seafood, Inc.	North Las Vegas	NV	-115.133	36.209
P51320A	Vida Meat Company	Las Vegas	NV	-115.145	36.179
P51322	World Food P&D, Inc.	Commerce	CA	-118.135	34.004
P51323	BRC Eatery	Miami	FL	-80.395	25.647
P51326	Savignano Foods Corp.	Orange	NJ	-74.24	40.773
P51327	B&A Gourmet Foods LLC	Hialeah	FL	-80.359	25.915
P51333	Bell Flavors & Fragrances	Northbrook	IL	-87.859	42.144
P51337	Carniceria Camacho	Tucson	AZ	-110.969	32.172
P51337A	Carniceria Camacho	Tucson	AZ	-110.968	32.172
P51341	Zuppardi's Frozen Foods	West Haven	CT	-72.945	41.274
P51344	Sky Chefs, LLC	Sacramento	CA	-121.596	38.688
P51345	Pearl River Foods, LLC	Carthage	MS	-89.526	32.773
P51346	Jubilee Hilltop Ranch	Osterburg	PA	-78.559	40.163
P51349	Total Packaging LLC	Owensboro	KY	-87.092	37.768
P51351	Underground Slaughter LLC	Walling	TN	-85.606	35.856
P51353	Leo's Gluten Free, LLC	Franklin Park	IL	-87.879	41.941
P51354	Select Cut Meat Processing	Chicago	IL	-87.638	41.857
P5137A	Nardone Brothers Baking Company, LLC	Hanover Township	PA	-75.923	41.207
P513B	Carl Buddig & Company	South Holland	IL	-87.623	41.593
P5141	King Solomon Foods inc.	Brooklyn	NY	-74.022	40.647
P5142	Washington Avenue Poultry	Brooklyn	NY	-74.006	40.685
P51548	Meat Cooler, Inc.	Saltsburg	PA	-79.346	40.574
P5155	Sahlen Packing Company, Inc.	Buffalo	NY	-78.842	42.884
P51554	Compass Group USA, Inc.	Melbourne	FL	-80.666	28.095
P51557	Ralph's Packing Company	Perkins	OK	-97.04	35.978
P5155A	Sahlen Packing Co., Inc.	Buffalo	NY	-78.842	42.883
P51563	Patriot Jerky, LLC	Conover	NC	-81.22	35.705
P51567	Sunny Dell Specialty LLC	Oxford	PA	-75.975	39.786
P5161	Fuji Foods, Inc.	Browns Summitt	NC	-79.728	36.173
P5161A	Fuji Foods, Inc	Browns Summit	NC	-79.73	36.175
P517	Mar-Jac Poultry-MS	Hattiesburg	MS	-89.277	31.306
P519	Amick Farms LLC	Laurel	MS	-89.12	31.693
P5197	David Mosner, Inc.	Bronx	NY	-73.872	40.807
P5200	Prime Food Distributor, Inc.	Port Washington	NY	-73.664	40.814
P5210	Liberty Bell Steak Co	Philadelphia	PA	-75.102	39.994
P522	Sanderson Farms, Inc. (Processing Div)	Collins	MS	-89.567	31.651
P5221	Home Food Services of PA, Inc.	Bristol	PA	-74.841	40.108
P5221A	Home Food Services of PA, Inc., DBA Agostino Foods	Fallsington	PA	-74.815	40.19
P5223A	Manchester Packing Co., Inc.	Hartford	CT	-72.658	41.748
P526	Robert M. Kerr Food and Agricultural Products Center	Stillwater	OK	-97.072	36.125
P5268	Cola Foods, LLC	Cranston	RI	-71.457	41.787
P5274	L.B. ORIENTAL FOOD PRODUCT CO., INC.	PAWTUCKET	RI	-71.363	41.883
P5275	Lupo's Quality Deli	Endicott	NY	-76.077	42.095
P5281A	PRG Packing Corp.	Madison	FL	-83.411	30.454
P529	Pilgrim's Pride Corporation	Arcadia	WI	-91.511	44.258
P5292	G & L Meat Company, Inc.	North Syracuse	NY	-76.128	43.124
P5307	Cook's Wholesale Foods Inc.	Old Forge	PA	-75.727	41.376
P5307B	Cooks Wholesale Foods, Inc.	Swoyersville	PA	-75.868	41.307
P5309	Cooks Wholesale Foods, Inc.	Berwick	PA	-76.238	41.061
P533	Free Bird Chicken	Fredericksburg	PA	-76.429	40.448
P5333	Zweigle's Inc.	Rochester	NY	-77.626	43.164
P5336	Casa Di Bertacchi, LLC	Vineland	NJ	-75.058	39.538
P5338	Schonwetter Enterprises, Inc., DBA Bilinski's Sausage Mfg Co.	Cohoes	NY	-73.705	42.758
P533A	Table Trust Brands, LLC	Fredericksburg	PA	-76.431	40.439
P5341	Brooklyn Provisions, Inc.	Carlstadt	NJ	-74.057	40.825
P5342	Seviroli Foods, LLC	Garden City	NY	-73.611	40.729
P5342B	Seviroli Foods, LLC	Hauppauge	NY	-73.261	40.82
P5344	Perrulli's Custom Meats Inc.	Toms River	NJ	-74.218	40.02
P5351	Martin's Specialty Sausage Company Inc.	Mickleton	NJ	-75.251	39.807
P5367	Carl's Boned Chicken, Inc.	New Haven	CT	-72.921	41.294
P5369	Numeat Packing, Inc.	San Juan	PR	-66.096	18.416
P537D	Kraft Heinz Foods Company	Davenport	IA	-90.61	41.617
P537H	Kraft Heinz Foods Company	Columbia	MO	-92.267	39.01
P537L	Kraft Heinz Foods Company	Avon	NY	-77.753	42.907
P537V	Kraft Heinz Foods Company	Kirksville	MO	-92.589	40.22
P5381	Prime Foodservice, Inc.	Tewksbury	MA	-71.185	42.62
P5382	Cifelli Sausage LLC	Sayreville	NJ	-74.342	40.429
P5385	Gaiser's European Style Provisions Inc.	Union	NJ	-74.271	40.697
P53855	Chihuly	Long Island City	NY	-73.947	40.74
P53859	Chunwei Inc.	Ontario	CA	-117.608	34.047
P53864	Midland Meat Packing NY, Inc.	Brooklyn	NY	-74.022	40.647
P53866	OSI Industries, LLC	West Chicago	IL	-88.262	41.867
P53869	1845 Smoked Meat Company, LLC	New Braunfels	TX	-98.09	29.713
P53877	Hat Creek Butchery	Plains	KS	-100.599	37.258
P53878	Hannah International Foods, Inc.	Seabrook	NH	-70.872	42.894
P53881	Mucca, Inc.	Gardena	CA	-118.303	33.903
P5390A	North Country Smokehouse	Claremont	NH	-72.387	43.339
P5397	Vincent Giordano Corporation	Philadelphia	PA	-75.187	39.94
P54	Daniele Operating, LLC - Stedagio	Mapleville	RI	-71.642	41.947
P5401	Leidy's, LLC	Easton	PA	-75.226	40.741
P541	Mar-View Farms LLC	Arabi	GA	-83.785	31.807
P5411	Schmalz European Provision Inc.	Springfield	NJ	-74.312	40.684
P5414	Pulaski Meat Products Company Inc.	Linden	NJ	-74.253	40.631
P5421	Spolem Provisions,LLC	Hamilton	NJ	-74.726	40.245
P5424	Dutch's Meats Inc	Ewing	NJ	-74.772	40.247
P54249	Victoria Livestock	Newark	NJ	-74.195	40.708
P54251	Bagelinos	Rockaway	NJ	-74.518	40.895
P54253	Empanada Kitchen Happily Baked Corp	San Diego	CA	-117.208	32.756
P54259	Maestri d'Italia Inc.	Lakewood	NJ	-74.187	40.07
P54260	Chef Kern's Wholesale LLC	Cumming	GA	-84.081	34.253
P54261	Global Appetizers Inc.	Hillsborough	NJ	-74.64	40.492
P54263	Kerry, Inc	Commerce	GA	-83.459	34.266
P54267	HeBo Family Foods, Inc.	Providence	RI	-71.425	41.832
P54269	DuFour Gourmet	Long Island City	NY	-73.95	40.752
P544	Legacy Turkey	Melrose	MN	-94.794	45.676
P54628	Metz Culinary Management	Sarasota	FL	-82.54	27.373
P54630	Rizzo's Malabar Inn, Inc.	Crabtree	PA	-79.473	40.363
P5476	G&M Co.	Newark	NJ	-74.172	40.746
P5477	Unity Beef Sausage Co., Inc.	Newark	NJ	-74.172	40.746
P548	JCG  Foods of Alabama, LLC	Collinsville	AL	-85.906	34.299
P5489	New Jersey Veal Co., Inc.	Garfield	NJ	-74.117	40.879
P549	Tyson Foods, Inc.	Springdale	AR	-94.152	36.155
P5495	Saker Shoprites Inc	Linden	NJ	-74.232	40.649
P5500	Tyson Prepared Foods, Inc.	Hutchinson	KS	-97.933	38.045
P5503	Fritz's Superior Sausage Co.	Leawood	KS	-94.61	38.94
P551	Jennie-O Turkey Store Sales, LLC	Willmar	MN	-95.08	45.11
P5516	SFC Global Supply Chain, Inc.	Sidney	OH	-84.179	40.269
P5520	Nordic Foods Inc.	Kansas City	KS	-94.687	39.095
P5526A	Reinhart Foodservice, LLC	West Salem	WI	-91.07	43.897
P5529	Dold Foods, LLC.	Wichita	KS	-97.326	37.736
P553	NationsMarket, LLC	Pembroke Park	FL	-80.178	25.989
P5533	West Liberty Foods, LLC	West Liberty	IA	-91.266	41.569
P5535	Smithfield Packaged Meats Corp.	Mason City	IA	-93.258	43.14
P5536	Banner Creek, LLC	Holton	KS	-95.727	39.462
P5538	General Mills, Inc.	Hannibal	MO	-91.412	39.681
P5540	Shamrock Meat Processing LLC	Waterloo	NE	-96.292	41.253
P5541A	Native American Enterprises, LLC	Wichita	KS	-97.389	37.687
P5552	Roca, Inc.	Chicago	IL	-87.738	41.799
P5553	Del Gould Meats, Inc.	Lincoln	NE	-96.691	40.847
P5561A	Bar-W Meat Company, LLC	Fort Worth	TX	-97.297	32.768
P5562	S&S Quality Meats	Emporia	KS	-96.248	38.414
P5578	Arck Foods, Inc.	Lincoln	NE	-96.635	40.878
P5581	Westin, Inc. Fairbury Food Division	Fairbury	NE	-97.175	40.133
P559	Tyson Foods, Inc.	Albertville	AL	-86.197	34.271
P5590	Ajinomoto Foods North America	Lampasas	TX	-98.177	31.067
P5593	Grabill Canning Company	Grabill	IN	-84.969	41.208
P56	Pilgrim's Pride Corporation	TIMBERVILLE	VA	-78.784	38.633
P560	Gentleman Sausages, LLC	Coeur d'Alene	ID	-116.781	47.674
P5605	Baja Foods, LLC	Chicago	IL	-87.642	41.819
P5607	A to Z Portion Control Meats, Inc.	Bluffton	OH	-83.89	40.895
P5615	OSI Industries, LLC	Fort Atkinson	WI	-88.853	42.914
P5617	Cargill Kitchen Solutions	Monticello	MN	-93.798	45.304
P5622	Albion Locker	Albion	NE	-97.998	41.692
P5625	Lakeside Foods, Inc.	Plainview	MN	-92.181	44.163
P5626	Byerly Foods International, Inc.	Lake Mills	IA	-93.533	43.429
P5630	SFC Global Supply Chain, Inc.	Pasadena	TX	-95.227	29.692
P5630D	SFC Global Supply Chain, Inc.	Deer Park	TX	-95.135	29.706
P5636	Smithfield Packaged Meats Corp.	St Charles	IL	-88.275	41.916
P5644	Specialty Sausage Co. LLC	Chicago	IL	-87.739	41.878
P5648	Lake Geneva Country Meats, Inc	Lake Geneva	WI	-88.35	42.594
P5650	Custom Pack Inc.	Hastings	NE	-98.389	40.567
P5652	Main Street Market	Humphrey	NE	-97.485	41.692
P5658	Loeffel Meat Laboratory / Animal Science Department	Lincoln	NE	-96.664	40.832
P5659	Schubert's Smokehouse Packing Co., Inc.	Millstadt	IL	-90.09	38.455
P5666	Quality Sausage Company, LLC	Dallas	TX	-96.859	32.771
P5666T	Quality Sausage QOZ, LLC	Dallas	TX	-96.859	32.77
P5668	Food Solutions 2, Inc.	Denver	CO	-104.85	39.787
P5674	Hastings Foods L.L.C.	Grand Island	NE	-98.38	40.913
P5686	Wausa Lockers Inc.	Wausa	NE	-97.538	42.499
P5687	Bay View Packing Company	Milwaukee	WI	-87.937	43.035
P5688	Ajinomoto Foods North America	Toluca	IL	-89.137	41.007
P569	MF Meats	Falconer	NY	-79.195	42.113
P5694	Kent Quality Foods Inc.	Grand Rapids	MI	-85.686	42.986
P5694A	Kent Quality Foods, Inc.	Hudsonville	MI	-85.869	42.838
P5696	AVF Holding LLC	Cuyahoga Falls	OH	-81.518	41.164
P5697	Swanson Meat Co.	Minneapolis	MN	-93.235	44.953
P5698	Taste Right Foods LLC	Rockport	IN	-87.05	37.893
P5699	Richelieu Foods, Inc.	Beaver Dam	WI	-88.826	43.476
P5710A	Smithfield Packaged Meats Corp.	Harrison	OH	-84.775	39.233
P5712	Valley Meats LLC	Coal Valley	IL	-90.462	41.428
P5722	Toman's City Market	Clarkson	NE	-97.122	41.726
P5723	Fremont Meat Market, Inc.	Fremont	NE	-96.495	41.444
P5726	Fairbury Steaks, Inc.	Fairbury	NE	-97.181	40.136
P5729	Twin Loups Quality Meats	St Paul	NE	-98.46	41.213
P5731	US Foods, Inc.	Aurora	IL	-88.285	41.808
P5742	Country Maid, Inc.	Milwaukee	WI	-87.91	43.009
P5754	Nestle USA, Inc.	Little Chute	WI	-88.324	44.285
P5758	Cargill Meat Solutions Corporation	Butler	WI	-88.074	43.102
P5766	Alewel's Country Meats	Warrensburg	MO	-93.736	38.778
P5777	University of Missouri Meat Market	Columbia	MO	-92.317	38.942
P578	James Calvetti Meats, Inc.	Chicago	IL	-87.651	41.816
P5787	Pilgrim's Pride Corporation	Natchitoches	LA	-93.107	31.725
P5788	Liberty Locker	La Belle	MO	-91.91	40.114
P5789	Vocci Ravioli Company	Kansas City	MO	-94.572	39.108
P579	Jennie-O Turkey Store	Faribault	MN	-93.276	44.303
P5798	Williams Brothers Meat Market	Washington	MO	-91.011	38.552
P5798A	Williams Brothers Meat Co.	Washington	MO	-91.02	38.557
P5800	Di Gregorio Food Products, Inc.	St. Louis	MO	-90.273	38.614
P5806	Cusack Wholesale Meats	Oklahoma City	OK	-97.518	35.453
P5808	Henningsen Foods, Inc.	Ravenna	NE	-98.911	41.024
P5811	Ajinomoto Foods North America, Inc.	Carthage	MO	-94.315	37.101
P5813	DS OFOOD, Inc.	Schleswig	IA	-95.437	42.154
P5819	Gourmet Ranch	Houston	TX	-95.505	29.926
P5833	Mo-Ark Provision Company Inc	Poplar Bluff	MO	-90.373	36.766
P5837	Simmons Prepared Foods, Inc.	Van Buren	AR	-94.358	35.433
P5839	Tyson Foods, Inc.	Russellville	AR	-93.086	35.27
P584	Pilgrim's Pride Corporation	Mount Pleasant	TX	-94.989	33.145
P5840	Simmons Prepared Foods, Inc.	Fort Smith	AR	-94.381	35.304
P5842	Tyson Foods, Inc.	Springdale	AR	-94.126	36.19
P5850A	Kraft Heinz Foods Company	San Diego	CA	-116.972	32.562
P5854	D&M Distributing	Ogden	UT	-112.009	41.21
P5860	Raven Brand Products	Armona	CA	-119.709	36.316
P5867A	Ohanyan's Inc.	Fresno	CA	-119.851	36.791
P5869	Choice Food Products Inc.	Fresno	CA	-119.833	36.76
P5883	Mountain Meadows Lamb Corporation	Denver	CO	-104.977	39.786
P5886	Goodman Food Products	Inglewood	CA	-118.352	33.967
P5886A	Goodman Food Products, Texas Inc.	Mansfield	TX	-97.133	32.572
P5889	A & S Produce Inc.	Vernon	CA	-118.186	33.999
P5890	M.C.I. Foods, Inc.	Compton	CA	-118.194	33.905
P5890A	M.C.I. Foods, Inc.	Santa Fe Springs	CA	-118.055	33.892
P5891	E&H Distributing LLC	LAS VEGAS	NV	-115.145	36.179
P5897	Jensen Meat Company, Inc	San Diego	CA	-116.981	32.553
P5898	Bot N Bot	Santa Fe Springs	CA	-118.054	33.947
P5903	American Skin Food Group LLC	Burgaw	NC	-77.92	34.543
P5906	Al & John Inc.	West Caldwell	NJ	-74.3	40.855
P5907	Burger Maker Inc.	Carlstadt	NJ	-74.08	40.836
P5912	Serra Sausage LLC	Vineland	NJ	-75.035	39.493
P5916	Longhini, LLC	New Haven	CT	-72.949	41.295
P5921	Arm National Foods	Trenton	NJ	-74.747	40.212
P5929	Wayne Meat Corporation	Wayne	NJ	-74.276	40.984
P5934	A.F.I. Food Service LLC "DBA" PFS Metro NY Custom Cuts	Elizabeth	NJ	-74.171	40.671
P5952	Lamberti Packing Company	New Haven	CT	-72.921	41.294
P5953	Italia Importing Company	New Haven	CT	-72.915	41.308
P5964	Minore's Meats, LLC	New Haven	CT	-72.944	41.316
P5967	City Line Distributors, LLC	West Haven	CT	-72.982	41.289
P597	Buckhead South Florida LLC	Medley	FL	-80.379	25.888
P5976	LaRosa Products	Hartford	CT	-72.676	41.737
P5985	Litchfield Prime Meats & Provisions LLC	Litchfield	CT	-73.18	41.748
P5987	Rocko Meats	Thurmont	MD	-77.433	39.58
P599	M.A.D. Burgers and Sausage	Phoenix	AZ	-112.001	33.4
P5993	Martin Rosol's, Inc.	New Britain	CT	-72.787	41.671
P6	Tyson Foods, Inc.	Blountsville	AL	-86.584	34.058
P6002	Provena Foods, Inc.	Lathrop	CA	-121.295	37.804
P6004	Wolf Pack Meats	Reno	NV	-119.734	39.513
P6005	Snak-King LLC	City of Industry	CA	-117.95	34.012
P6006	Carlotta's Kitchen LLC	Tucson	AZ	-110.958	32.212
P6009	Ruiz Food Products, Inc.	Vernon	CA	-118.209	34.004
P6010T	National Steak Processors (2024), LLC.	Owasso	OK	-95.851	36.26
P6016	Papa Cantella's Inc	Vernon	CA	-118.207	33.999
P6018	Eureka Sausage Company	North Hollywood	CA	-118.379	34.195
P6022	Milan Salami Co.	Oakland	CA	-122.287	37.849
P6024	Courage Production, LLC	Fairfield	CA	-122.08	38.233
P6028	Meadow Farms Sausage Company	Los Angeles	CA	-118.309	33.983
P6030	Evans Food Group	City of Industry	CA	-117.963	34.021
P6037	Aries Beef LLC	Burbank	CA	-118.315	34.18
P6045	Valley Meat & Food LLC	Alamosa	CO	-105.875	37.464
P6052	CREATIVE FOOD PROCESSING	SANTA CLARA	CA	-121.959	37.365
P6056	Schenk Packing Company, Inc.	Stanwood	WA	-122.344	48.257
P6056A	Schenk Packing Company Warehouse	Mount Vernon	WA	-122.335	48.412
P6058	Perdue Foods LLC	Mount Vernon	WA	-122.331	48.433
P6068	Evergood Sausage Company	San Francisco	CA	-122.388	37.727
P607	Tyson Foods, Inc.	Rogers	AR	-94.114	36.332
P6070	Los Angeles Poultry	Los Angeles	CA	-118.243	34.0
P6074	Continental Gourmet Sausage	Glendale	CA	-118.288	34.166
P6075	E.C. Wilson Co., Inc.	Brier	WA	-122.26	47.798
P6076	Scotty's Country Smokehouse	Idaho Falls	ID	-112.009	43.537
P6076A	Glenwood Snacks LLC	Saint Anthony	ID	-111.686	43.947
P6076B	Scotty's Country Smokehouse	Idaho Falls	ID	-112.009	43.537
P6080	WEST BEST FOODS INC	LAS VEGAS	NV	-115.195	36.128
P6081	Great  River Food	City of Industry	CA	-117.879	33.999
P6086	Silva Sausage Co.	Gilroy	CA	-121.55	36.988
P6087	Victor's Market Co Inc	Hawthorne	CA	-118.344	33.927
P609	The XCJ Corp	Sumner	WA	-122.236	47.214
P6111	B & S Food Products	Walnut	CA	-117.859	34.012
P6117	Kanab Custom Meats, Inc.	Kanab	UT	-112.518	37.041
P6119	C.R. Meats	Oakland	CA	-122.277	37.829
P6121B	King's Command Foods (2022), LLC	Versailles	OH	-84.485	40.23
P6124	Compass Foods, Inc.	Modesto	CA	-120.996	37.621
P6133	Daily's Premium Meats, LLC	Salt Lake City	UT	-111.905	40.694
P6137	Foster Poultry Farms, LLC	Livingston	CA	-120.731	37.396
P6137A	Foster Poultry Farms, LLC	Fresno	CA	-119.783	36.693
P6137B	Foster Poultry Farms, LLC	Livingston	CA	-120.731	37.396
P6138	Gelsinger Meats, Inc.	Montrose	CA	-118.226	34.205
P6140	Golden Farms	Canoga Park	CA	-118.6	34.2
P6147	Overhill Farms, Inc.	Vernon	CA	-118.224	34.006
P6149	Central Meat and Provision Company	San Diego	CA	-117.15	32.704
P6152	S.A. Piazza & Associates, LLC	Clackamas	OR	-122.556	45.408
P6152A	S.A. Piazza & Associates Inc.	Clackamas	OR	-122.535	45.407
P6153	M Group Industries	Spring Valley	CA	-116.966	32.727
P6154	Caggiano Company	Sebastopol	CA	-122.811	38.385
P6164A	Foster Poultry Farms, LLC	Kelso	WA	-122.899	46.126
P6172	Taylor's Sausage, Inc.	Cave Junction	OR	-123.652	42.165
P6184	January Foods Corp	Kent	WA	-122.264	47.427
P6186	Juanita's Foods	Wilmington	CA	-118.256	33.779
P6202	Payless Distribution Center (PDC)	Dededo	GU	144.825	13.502
P6203	Old Trapper Smoked Products, Inc.	Forest Grove	OR	-123.075	45.526
P6203A	Old Trapper Smoked Products, Inc.	Forest Grove	OR	-123.076	45.526
P6206	Fabrique Delices, LLC	Hayward	CA	-122.063	37.613
P6211A	Baxters North America	Salem	OR	-123.053	44.946
P6211K	Baxters North America	East Bernstadt	KY	-84.128	37.177
P6214	Stone Meat Inc	Pleasant View	UT	-112.021	41.324
P6217	South Gate Meat Company	South Gate	CA	-118.217	33.951
P6218	Burnett & Son Meat Co., Inc.	Monrovia	CA	-118.0	34.136
P622	Tyson Foods, Inc.	Monroe	NC	-80.492	34.982
P6220A	Idaho Smokehouse Partners LLC	Shelley	ID	-112.121	43.394
P6232	Ready Foods, Inc.	Denver	CO	-104.931	39.773
P6232B	Ready Foods	Denver	CO	-104.919	39.776
P6236	Flocchini Family Provisions, Inc.	Carson City	NV	-119.764	39.181
P6239	Shamrock Foods Company	Phoenix	AZ	-112.123	33.477
P6246	Ramona's Food Group	Gardena	CA	-118.31	33.908
P6247	R & G Fine Foods, Inc.	Northridge	CA	-118.557	34.232
P6248	Plano Jerky	Porterville	CA	-119.008	36.053
P6250	JBS USA	Denver	CO	-105.016	39.717
P6251	Jobbers Meat Packing Co Inc	Los Angeles	CA	-118.207	33.996
P6252	Pontrelli & Laricchia LLC	Vernon	CA	-118.205	33.986
P6254	Temptee Brand Steak, Inc.	Denver	CO	-104.964	39.804
P6264	Harrisville Cannery	Harrisville	UT	-111.981	41.267
P6266	LJD Holdings, Inc.	Boise	ID	-116.193	43.571
P6267	Interbay Food Company	Woodinville	WA	-122.147	47.767
P6271	Stillwater Packing Co.	Columbus	MT	-109.277	45.668
P6273	House Of Smoke, Inc.	Fort Lupton	CO	-104.811	40.087
P628	Swift Beef Company	Hyrum	UT	-111.86	41.644
P6281	Russak's Cured & Smoked Products	Los Angeles	CA	-118.226	34.044
P629	Mrs. Budd's Kitchen, LLC	Manchester	NH	-71.452	42.976
P6290	Del Mar Meats, Inc.	San Gabriel	CA	-118.089	34.096
P6292	Venus Foods Inc.	City of Industry	CA	-117.951	34.011
P6308	Zenner's Quality Meat Products, Inc.	Wilsonville	OR	-122.771	45.316
P6313	Savenor's Supply Company, Inc.	Chelsea	MA	-71.024	42.389
P6335	Crocetti's Oakdale Packing Company, Inc.	East Bridgewater	MA	-70.984	42.04
P6336	Crocetti's Oakdale Packing	Brockton	MA	-71.002	42.08
P635	Cargill Meat Solutions Corporation	Waco	TX	-97.123	31.609
P6354	E.L. Blood & Son, Inc.	West Groton	MA	-71.621	42.601
P6358	South Coast Gormet Sausage, Inc.	Fall River	MA	-71.135	41.689
P6360	Zonin's Meats Inc.	Springfield	MA	-72.583	42.098
P6373	Grossglockner Inc.	Canandaiqua	NY	-77.304	42.902
P6373B	Grossglockner, Inc.	Canadaigua	NY	-77.314	42.908
P6387	Mayabeque Products Corp.	North Bergen	NJ	-74.008	40.799
P6396	Dom's Sausage Co., Inc.	Malden	MA	-71.075	42.421
P6402A	Perdue Foods LLC	Mount Vernon	WA	-122.333	48.392
P6403A	Plymouth Poultry Co.	Auburn	WA	-122.231	47.338
P6404	Redondo's LLC	Waipahu	HI	-158.018	21.377
P6405	GBS Partners, Inc.	Louisville	CO	-105.122	39.963
P6407	Laurienti & LaBate Meat, Inc.	Denver	CO	-104.978	39.829
P6410	Hempler Foods Group LLC	Ferndale	WA	-122.583	48.839
P642	Vietti Foods Company, Inc	Nashville	TN	-86.772	36.137
P6423	Rainier Pure Beef Company	Woodland	WA	-122.744	45.892
P6424	Fischer Meats	Issaquah	WA	-122.037	47.531
P6426	Tcm, Inc.,	Olympia	WA	-122.846	47.037
P6432	Continental Sausage, Inc.	Denver	CO	-104.975	39.834
P6433	S'Kallam Meat & Seafood, LLC	Bremerton	WA	-122.68	47.56
P6437	Evergreen Meats Inc.	Port Angeles	WA	-123.442	48.12
P6444	Angus Meats, Inc.	Spokane	WA	-117.387	47.684
P646	JCG Foods of Georgia, LLC	Pine Mt Valley	GA	-84.811	32.799
P6460	Scanga Meat Company	Salida	CO	-106.01	38.553
P6467	Steele's Meat Co. LLC	Lafayette	CO	-105.107	40.001
P6474	Polidori Meat Processors Inc.	Denver	CO	-104.931	39.77
P6476	Tico's Mexican Foods	Denver	CO	-104.99	39.68
P6479	Mr. J's Tamales & Chili, Inc.	Lynwood	CA	-118.226	33.934
P6492	Foster Poultry Farms LLC	Compton	CA	-118.217	33.909
P6496	Prairie Meats LLC	Brush	CO	-103.624	40.252
P6498	Cacique, Inc.	Cedar City	UT	-113.07	37.69
P64A	Fred's Meat and Processing	Ashley	IL	-89.204	38.33
P65	Tony Downs Foods	Madelia	MN	-94.419	44.046
P650	Grateful Pastures, LLC	Mansfield	GA	-83.759	33.436
P6504	Peco Foods, Inc.	Tuscaloosa	AL	-87.561	33.178
P6505	Norman W. Fries, Inc.	Claxton	GA	-81.891	32.181
P6507	Hartman Enterprises Inc. DBA Hartman Meat Co.	Hyattsville	MD	-76.927	38.924
P6510	Peco Foods, Inc	Bay Springs	MS	-89.285	32.016
P6515	Family Brands, LLC	Lenoir City	TN	-84.257	35.79
P6519	Crider, Inc.	Stillmore	GA	-82.214	32.429
P6519B	Coastal Processing, LLC	Louisville	GA	-82.463	33.003
P6524	Embutidos Don Frank	Carolina	PR	-65.982	18.403
P6529	Koch Foods of  Montgomery, AL	Montgomery	AL	-86.355	32.329
P6533	VIE DE FRANCE YAMAZAKI, INC	ALEXANDRIA	VA	-77.104	38.808
P6537	University of Florida Meat Lab	Gainesville	FL	-82.352	29.631
P654	Alpha Foods Co.	Waller	TX	-95.948	30.054
P6548	Century Titan, LLC	Catano	PR	-66.143	18.433
P6554	Wells Processing Plant	Brighton	TN	-89.72	35.484
P6561	Volunteer Meats LLC	Lexington	TN	-88.279	35.632
P6566	Bagel Bites	Ft Myers	FL	-81.803	26.665
P6568	St. Clair Foods Inc.	Memphis	TN	-90.026	35.064
P657	Kraft Heinz Company	Muscatine	IA	-91.042	41.438
P6572	Lawson Institutional Foods	Waco	GA	-85.239	33.656
P6574	GWB, LLC	Fort Lauderdale	FL	-80.144	26.085
P6585	Hopkins Poultry Co., Inc.	Browns Summit	NC	-79.723	36.216
P6599	Star Food Products, Inc.	Burlington	NC	-79.441	36.091
P6613	Tennesse Valley Packing Co., Inc.	Columbia	TN	-87.031	35.621
P6616	Peco Foods, Inc.	Sebastopol	MS	-89.324	32.575
P6620	Hormel Foods Corporation	Tucker	GA	-84.251	33.839
P6621	Dean Sausage Company, Inc.	Attalla	AL	-86.125	33.988
P6636	Pete's Country Meats	Loretto	TN	-87.391	35.06
P6638	Pilgrim's Pride Corporation	Enterprise	AL	-85.958	31.254
P6639	A.L. Beck & Sons, Inc.	Winston-Salem	NC	-80.211	36.006
P664	Buckhead Meat Company	Warwick	RI	-71.446	41.731
P6640	Kabobs Aquisition, LLC	Lake City	GA	-84.336	33.607
P6644	Conecuh Sausage	Andalusia	AL	-86.457	31.338
P6645	Carolina Fresh Foods	Florence	SC	-79.776	34.198
P6648	Blue Ridge Meats	Rabun Gap	GA	-83.358	34.971
P6651	Tyson Foods, Inc.	Shelbyville	TN	-86.475	35.478
P6653	Miami Beef Co., Inc.	Miami	FL	-80.279	25.916
P6654	Jenkins Foods, Inc.	Shelby	NC	-81.691	35.391
P6660	Pender Packing Company, Inc.	Rocky Point	NC	-77.956	34.424
P6662	Kenosha Beef International	Norcross	GA	-84.206	33.916
P6666	Koch Foods of Gadsden, LLC	Gadsden	AL	-85.971	33.969
P6668	Morty Pride Meats, Inc.	Fayetteville	NC	-78.794	35.033
P667	Mountaire Farms Inc.	Selbyville	DE	-75.228	38.46
P6678	Ganaderia Santiago Inc.	Yauco	PR	-66.884	18.025
P6682	Ganaderos Alvarado, Inc.	Arecibo	PR	-66.707	18.417
P6685	ECP Foods LLC	Greenwood	SC	-82.144	34.191
P669	(Lebanon) - Godshall's Quality Meats, Inc.	Lebanon	PA	-76.394	40.357
P6697	Bryant's Meat Inc	Taylorsville	MS	-89.443	31.834
P671	Sanderson Farms Foods, LLC	Flowood	MS	-90.104	32.321
P6715	Beaver Street Fisheries, Inc.	Jacksonville	FL	-81.689	30.336
P6717	EuroCaribe Packing Company	Vega Baja	PR	-66.389	18.452
P6719	Pilgrim's Pride Corporation	Chattanooga	TN	-85.304	35.038
P6725	Copper Cellar Corp	Knoxville	TN	-83.968	35.978
P6726	Johnson Bros Wholesale Meats I	Panama City	FL	-85.65	30.178
P6729	Provimi de Puerto Rico, Inc.	Morovis	PR	-66.425	18.338
P673	Major Products Co., Inc.	Little Ferry	NJ	-74.035	40.846
P6744	Segarra's Sausage	Moca	PR	-67.066	18.365
P6747	D. L. Lee & Sons (Establishment 6747/P-6747)	Alma	GA	-82.44	31.538
P676	RRR Meat Processing	Buckley	MI	-85.686	44.489
P6761	Italia Foods, Inc	Schaumburg	IL	-88.058	42.071
P6761A	Italia Foods	Schaumburg	IL	-88.06	42.068
P6765	Wichita Packing Company	Chicago	IL	-87.685	41.888
P677	Praters Foods	Lubbock	TX	-101.867	33.493
P679	Westville Meat Market & Processing LLC	Westville	FL	-85.852	30.764
P6791	Knaus Sausage House	Kimball	MN	-94.301	45.313
P6796	Oriental Kitchen Corp.	Chicago	IL	-87.665	41.886
P6797	Ogden Foods, LLC	Chicago	IL	-87.732	41.848
P6798	Park 100 Foods, LLC	Tipton	IN	-86.037	40.28
P6803	Karn Meats, Inc.	Columbus	OH	-82.96	39.986
P6810	Meats By Linz	Hammond	IN	-87.513	41.627
P6813	Supreme Tamale Company	Elk Grove Village	IL	-87.963	42.017
P6817	Zwanenberg Food Group (USA), Inc.	Cincinnati	OH	-84.623	39.136
P6823	J. Brodie Meat Products, Inc.	Galesburg	IL	-90.38	40.931
P6828	Fresh Mark Canton	Canton	OH	-81.331	40.814
P6829A	Burke Marketing Corporation	Nevada	IA	-93.439	42.008
P6835	CBQ, LLC (DBA Carl Buddig and Company)	South Holland	IL	-87.623	41.612
P6837	Turri's Italian Foods, Inc.	Roseville	MI	-82.949	42.517
P6838	Queen City Sausage & Provision, Inc	Cincinnati	OH	-84.536	39.131
P6839	Frozen Specialties, Inc.	Archbold	OH	-84.297	41.516
P6844	Makowski's Real Sausage Company	Lansing	IL	-87.545	41.592
P6849	Parker House Sausage Company	Chicago	IL	-87.626	41.811
P6858	Hormel Foods Corporation	Beloit	WI	-88.978	42.521
P6863	Smithfield Packaged Meats Corp.	Peru	IN	-86.026	40.719
P6869	AdvancePierre Foods, Inc.	Amherst	OH	-82.199	41.416
P687	House of Raeford	West Columbia	SC	-81.058	33.997
P6872	John R Morreale Meat Inc.	Bedford Park	IL	-87.797	41.773
P6873	Dorina/So-Good, Inc.	Union	IL	-88.535	42.234
P6879	Porkie Co. Of Wis., Inc.	Cudahy	WI	-87.871	42.959
P687A	Albert Lea Select Foods Inc.	Albert Lea	MN	-93.348	43.68
P6882	Park 100 Foods, LLC	Kokomo	IN	-86.137	40.503
P6899	AMPC, LLC.	Lytton	IA	-94.86	42.422
P68A	Beech-Nut Nutrition Corporation	Amsterdam	NY	-74.228	42.941
P6915	White Castle System, Inc.	Orleans	IN	-86.454	38.647
P6916	Amity Packing Co. Inc.	Chicago	IL	-87.733	41.816
P6922	Zick's Specialty Meats, Inc.	Berrien Springs	MI	-86.338	41.949
P6930	OSI Industries, LLC	Chicago	IL	-87.765	41.803
P6934	Stap Inc.	Wheeling	IL	-87.911	42.123
P6935	Conagra Brands (Conagra Foods Packaged Foods LLC)	Macomb	MI	-82.97	42.674
P694	Kansas State University	Manhattan	KS	-96.578	39.195
P6944	Fontanini Foods, LLC	McCook	IL	-87.838	41.799
P6945	Butterfield Foods, LLC	Noblesville	IN	-86.027	40.045
P695	Nestle Prepared Foods Company	Solon	OH	-81.47	41.405
P6962	Meat Science Laboratory, Univ. of IL	Urbana	IL	-88.223	40.099
P6964	Bende & Son Salami Co. Inc.	Vernon Hills	IL	-87.943	42.216
P6985	Bridgford Food Processing Corporation	Chicago	IL	-87.661	41.813
P7000	Alma Foods, LLC	Alma	KS	-96.289	39.011
P7011	Creative Specialty Food Solutions, LLC	Houston	TX	-95.343	29.801
P7022	Matador Butcher Shop, LLC	Palmyra	MO	-91.518	39.802
P7036	Yan Wholesale, Inc.	Sacramento	CA	-121.473	38.534
P7044	Tyson Foods, Inc.	Carthage	TX	-94.326	32.173
P705	Pilgrim's Pride Corporation	De Queen	AR	-94.341	34.032
P7050	Dalhart Meats, LLC	Dalhart	TX	-102.496	36.054
P7055	Brown's Meat Locker	Stratford	TX	-102.064	36.322
P7066	J Bar B Foods	Waelder	TX	-97.298	29.692
P7066A	J Bar B Foods	Weimar	TX	-96.802	29.699
P7067	1st Original Texas Chili Company, Inc.	Fort Worth	TX	-97.349	32.806
P7075	TFSP, LLC	Van Buren	AR	-94.333	35.422
P7079	Bueno Foods	Albuquerque	NM	-106.654	35.065
P7085	Tyson Foods, Inc	Broken Bow	OK	-94.74	34.05
P7091	Pilgrim's Pride Corporation	Mount Pleasant	TX	-94.983	33.146
P7091A	Pilgrim's Pride Corporation	Mount Pleasant	TX	-94.983	33.146
P7095	Harvest Food Products Co., Inc	Hayward	CA	-122.054	37.621
P710	Allen Brothers - Texas	Dallas	TX	-96.88	32.68
P7100	Tyson Foods, Inc.	Nashville	AR	-93.847	33.928
P7101	Tyson Foods, Inc.	Clarksville	AR	-93.456	35.472
P7117	Cargill Meat Solutions	Nebraska City	NE	-95.881	40.666
P7138	Valley Meat Supply	Valley City	ND	-98.021	46.919
P7147	4G Meat Processing LLC	Kansas City	MO	-94.552	39.118
P7156	Tyson Foods, Inc.	Hope	AR	-93.613	33.741
P7159	Greer's Ranch House Sausage, LLC	Pryor	OK	-95.329	36.279
P7168	Manuel's Odessa Tortilla & Tamale Factory, Inc.	Odessa	TX	-102.345	31.856
P7174	Butterball, LLC	Huntsville	AR	-93.738	36.102
P7176	Plains Meat Co. LTD	Lubbock	TX	-101.844	33.588
P7177	Kelly's Bar-B-Que, Inc.	Waco	TX	-97.164	31.57
P717CR	Smithfield Fresh Meats Corp.	Crete	NE	-96.963	40.578
P7184M	Double B Foods, Inc.	Meridian	TX	-97.657	31.924
P7189	Ponderosa Meat Co.	Reno	NV	-119.806	39.512
P7190	Hausman Foods (2024), LLC	Corpus Christi	TX	-97.441	27.782
P7195	Speedy Foods LLC	Commerce City	CO	-104.906	39.786
P72	Tyson Foods, Inc	Dardanelle	AR	-93.162	35.217
P7204	El Merendero Posa's	Santa Fe	NM	-105.963	35.639
P7211	Tyson Foods, Inc.	Berryville	AR	-93.567	36.371
P7212	Buckhead Meat & Seafood of Houston.	Houston	TX	-95.418	29.917
P7217	Farm Fresh Food Suppliers, Inc.	Amite	LA	-90.551	30.725
P7221	Tyson Foods, Inc.	Rogers	AR	-94.121	36.318
P7226	Bear Creek Smokehouse	Marshall	TX	-94.503	32.616
P7231	HEB Meat Plant	San Antonio	TX	-98.404	29.475
P7232	New Mexico Mexican Foods	Las Cruces	NM	-106.769	32.309
P7243	Smokey Denmark Sausage Company	Austin	TX	-97.704	30.254
P7246A	Rodriguez Foods Ltd.	Fort Worth	TX	-97.338	32.797
P7250	Tyson Prepared Foods, Inc.	South Hutchinson	KS	-97.943	38.029
P7251	Mennonite Central Committee U.S.	Manheim	PA	-76.393	40.218
P7251A	Goshen, IN Canning Project	Goshen	IN	-85.85	41.592
P7251B	Mennonite Central Committee U.S.	Hydro	OK	-98.58	35.545
P7251C	Mennonite Central Committee	Henderson	NE	-97.808	40.779
P7251E	MCC Central States	North Newton	KS	-97.344	38.079
P7251F	Mennonite Central Committee U.S.	Wellman	IA	-91.843	41.54
P7255	Tyson Foods, Inc.	Fort Smith	AR	-94.41	35.396
P7264	Sanderson Farms, Inc.	Hammond	LA	-90.508	30.505
P727	Simmons Prepared Foods, Inc.	South West City	MO	-94.599	36.544
P7271	C & L Foods, Inc.	Dallas	TX	-96.827	32.791
P7279	Pedro's Foods LLC	Lubbock	TX	-101.843	33.519
P7287	Thompson Packers, Inc.	Slidell	LA	-89.782	30.295
P7301	C&S Wholesale Meat Co.	Atlanta	GA	-84.364	33.728
P7302	Dean Commissary LP	Antioch	TN	-86.683	36.072
P7303	CFCM, LLC	Paris	TN	-88.291	36.277
P7305	Critchfield Meats, Inc.	Lexington	KY	-84.518	38.085
P7317	Ross and Ross Grocery	Tompkinsville	KY	-85.692	36.701
P7322	Foster Poultry Farms, LLC	Demopolis	AL	-87.833	32.477
P7333	Manchester Farms, Inc.	Hopkins	SC	-80.873	33.905
P7341	Winningham's Meats	Ridgeville	SC	-80.204	33.137
P7342	Wayne Farms LLC	Dothan	AL	-85.363	31.225
P7345	Butterball, LLC	Mount Olive	NC	-77.914	35.14
P7353	Colorado Boxed Beef Co.	Lakeland	FL	-81.946	28.048
P7356	Dinos Farm LLC	Warsaw	KY	-84.785	38.82
P7359	Elaboracion Felo, Inc.	Aguadilla	PR	-67.156	18.42
P7360	Productos La Aguadillana, Inc.	Aguadilla	PR	-67.148	18.461
P7361	DeOro Foods LLC	Reidsville	NC	-79.652	36.331
P737	House of Raeford - Wallace Div	Teachey	NC	-78.051	34.756
P7374	To-Ricos, Ltd.	Aibonito	PR	-66.282	18.13
P7375	Century Packing Corp.	Las Piedras	PR	-65.88	18.189
P738	Bimmy's Food Made With Love	Long Island City	NY	-73.932	40.742
P74	Fisher Packing Company	Redkey	IN	-85.166	40.345
P7400	Moonlite Bar-B-Q Inn, Inc.	Owensboro	KY	-87.149	37.757
P7415	HOFFMAN'S QUALITY MEATS	HAGERSTOWN	MD	-77.753	39.677
P7417	Blue Grass Provisions Co. Inc.	Crescent Springs	KY	-84.586	39.047
P7421A	University of Georgia Meat Plant	Athens	GA	-83.369	33.936
P7428	Joyce Foods, Inc.	Winston Salem	NC	-80.374	36.041
P7429	Hampton Premium Meats	Hopkinsville	KY	-87.456	36.84
P7439	Cheney OFS, Inc.	Greensboro	NC	-79.973	36.087
P744	Vineland Poultry LLC	Vineland	NJ	-75.063	39.472
P7446	Rudolph Foods Company, Inc	New Hebron	MS	-89.989	31.741
P745	Purely Meat Purveyors LLC.	Forest Park	IL	-87.811	41.854
P7454	Rich Products Corporation	Gallatin	TN	-86.453	36.384
P7455	Williams Sausage Company, Inc.	Union City	TN	-89.162	36.479
P7457	Buzz Products, Inc.	Charleston	WV	-81.56	38.288
P7457A	Appalachian Abattoir	Charleston	WV	-81.56	38.288
P7460	Waltkoch LTD	Gainesville	GA	-83.824	34.274
P7464	F.B. Purnell Sausage Company Inc.	Simpsonville	KY	-85.35	38.223
P7467	Specialty Foods Group, LLC	Owensboro	KY	-87.133	37.778
P7470	Mountaire Farms Inc. - NC Division	Lumber Bridge	NC	-79.106	34.868
P7471	State Street Poultry & Provisions, LLC	Baltimore	MD	-76.645	39.269
P748	Gerber Products Company	Fort Smith	AR	-94.381	35.431
P7483	Saval Foods Corporation	Baltimore	MD	-76.559	39.299
P7483A	Deli Brands of America	BALTIMORE	MD	-76.671	39.256
P7483B	1932 Specialty Produce and Meat	Elkridge	MD	-76.752	39.196
P7485	Wayne Farms LLC	Jack	AL	-85.9	31.501
P7487	Koch Foods, LLC	Chattanooga	TN	-85.305	35.032
P7491	Carey & Schnalzer's Quality Meats (Slate Belt Butchery)	New Tripoli	PA	-75.749	40.693
P7527	Rafka Foods, Inc.	Aliquippa	PA	-80.268	40.592
P754	LuLu Commercial Kitchen	Maryland Heights	MO	-90.441	38.709
P7567	Wegmans Food Markets	Rochester	NY	-77.699	43.12
P757	The Hillshire Brands Company	Storm Lake	IA	-95.184	42.639
P7573	Hans Kissle Company, LLC	Haverhill	MA	-71.124	42.79
P758	Tyson Foods, Inc	Carthage	MS	-89.536	32.824
P7602	M&W Beef Packers Inc.	Mandan	ND	-100.895	46.832
P7603	Cloverdale Foods Co.	Mandan	ND	-100.932	46.857
P7610	Fargo Packing Company	West Fargo	ND	-96.896	46.876
P7611	Casselton Cold Storage Inc.	Casselton	ND	-97.212	46.901
P7613	Smithfield Packaged Meats Corp.	Sioux Falls	SD	-96.72	43.562
P7615	Fairmount Lockers	Fairmount	ND	-96.605	46.055
P7627	North Dakota State University Meat Laboratory	Fargo	ND	-96.81	46.893
P7632	Foster Poultry Farms, LLC	Fresno	CA	-119.824	36.716
P7633	Ideal Meat LLC	Northridge	CA	-118.534	34.229
P764	Perdue Foods, LLC	Salisbury	MD	-75.605	38.366
P7641	Myers Meats And Specialties	Parshall	ND	-102.085	47.769
P7644	Yellowstone River Beef	Williston	ND	-103.603	48.139
P7645K	Schwan's Food Company Global Supply Chain, Inc.	Florence	KY	-84.636	38.975
P7650	Missouri River Meats	Great Falls	MT	-111.266	47.515
P7652	Bavaria Sausage of Wisconsin, Inc.	Madison	WI	-89.484	43.007
P7669	Turkey Valley Farms, Inc.	Marshall	MN	-95.796	44.45
P7677	Anderson Boneless Beef	Denver	CO	-104.957	39.824
P7679	Ranchers' Best Meats	Miles City	MT	-105.806	46.445
P768	Tyson Foods, Inc.	Waldron	AR	-94.102	34.904
P7681	Phu Huong Food Company, Inc.	Rosemead	CA	-118.073	34.063
P7693	J & J Snack Foods Handheld Corp.	Weston	OR	-118.427	45.819
P7696	Mattern Sausage	Orange	CA	-117.859	33.804
P7697	Castle Rock Meats, Inc.	Denver	CO	-104.977	39.788
P7698	CTI Foods LLC	Wilder	ID	-116.913	43.696
P77	Maid-Rite Specialty Foods, Inc.	Dunmore	PA	-75.614	41.436
P770	Hometown Food Company	Milton	PA	-76.856	41.012
P7704	Riley's Meats	Butte	MT	-112.538	46.013
P7716	BPM Fine Foods	Redwood City	CA	-122.206	37.482
P7717	White's Wholesale Meats	Ronan	MT	-114.064	47.53
P7718	Glacier Processing Cooperative	Columbia Falls	MT	-114.164	48.312
P7719	La Joya Products	Los Angeles	CA	-118.205	34.03
P772	Giovanni's Appetizing Food Products, Inc.	Richmond	MI	-82.736	42.81
P7721A	Nestle USA - Prepared Foods Division, Inc.	Mt. Sterling	KY	-83.906	38.095
P7722	Smith Meat Company, LLC	Rigby	ID	-111.9	43.688
P7738	MGH Gourmet Inc.	Rancho Dominguez	CA	-118.21	33.867
P7748	Colorado Homestead Ranches, Inc.	Delta	CO	-108.08	38.741
P7750	General Mills Operations, Inc.	Wellston	OH	-82.538	39.09
P7761	Park 100 Foods, LLC	Morristown	IN	-85.683	39.676
P7766	Deli Star	St. Louis	MO	-90.226	38.624
P7769	Farbest Foods, Inc.	Huntingburg	IN	-86.981	38.311
P7769A	Farbest Foods, Inc.	Huntingburg	IN	-86.978	38.307
P7777	Minnesota Meat Masters	Annandale	MN	-94.109	45.259
P7779	Randolph Packing Company	Streamwood	IL	-88.177	42.005
P7780A	Urban Farmer, LLC	Manteno	IL	-87.815	41.245
P7785	Huettl's Locker & Dressing Plant	Lake City	MN	-92.288	44.463
P7787	Institution Food House, Inc.	Fairfield	OH	-84.497	39.334
P77A	Maid-Rite Specialty Foods, Inc.	Scranton	PA	-75.663	41.404
P7804	Westerly Packing, Inc.	Westerly	RI	-71.836	41.4
P7809	Dakin Farm Inc.	Ferrisburg	VT	-73.23	44.243
P7812	Finger Food Products, LLC	Sanborn	NY	-78.92	43.114
P7817	US Foods Inc	Blasdell	NY	-78.799	42.798
P783	Harris Ranch Beef Company	Selma	CA	-119.616	36.498
P7831	Milmar Food Group II, LLC	Goshen	NY	-74.36	41.399
P7839	Kayem Foods Inc.	Chelsea	MA	-71.04	42.392
P7856	Viet My Corporation, Inc.	Woodbridge	VA	-77.255	38.626
P787	Schreiber Processing Corporation	Maspeth	NY	-73.909	40.725
P7875	Joe Jurgielewicz & Son, Ltd.	Hamburg	PA	-76.02	40.526
P7875A	Joe Jurgielewicz & Son, Ltd.	Leesport	PA	-75.956	40.443
P7877A	Rastelli	Swedsboro	NJ	-75.377	39.752
P7877B	Rastelli Global	Swedesboro	NJ	-75.365	39.769
P7878	Thumann Inc.	Carlstadt	NJ	-74.071	40.83
P788	Yoakum Packing Co.	Yoakum	TX	-97.15	29.289
P7882	Horst Meats	Hagerstown	MD	-77.752	39.703
P7883	Cooperativa de Porcinocultores de Puerto Rico y el Caribe	Guaynabo	PR	-66.103	18.333
P7885	A&S & Son	Keansburg	NJ	-74.13	40.442
P7886	K & K Gourmet Meats, Inc.	Leetsdale	PA	-80.219	40.572
P7899	Hofmann Sausage	Syracuse	NY	-76.091	43.095
P7900	Prestige Farms, Inc.	Charlotte	NC	-80.745	35.266
P7903	Perdue Foods, LLC	Accomac	VA	-75.657	37.734
P7909	G.A. Food Services of Pinellas County, LLC	St. Petersburg	FL	-82.676	27.883
P791	Clemens Food Group, LLC	Hatfield	PA	-75.322	40.269
P7914	Creation Gardens	Louisville	KY	-85.506	38.275
P7916	Chairman's Foods LLC	Nashville	TN	-86.709	36.145
P791N	Clemens Food Group, LLC	Hatfield	PA	-75.315	40.268
P7927	AMICK FARMS, LLC	HURLOCK	MD	-75.857	38.635
P7928	Halpern's Steak and Seafood	Baltimore	MD	-76.626	39.28
P7935	Cargill Meat Solutions	Timberville	VA	-78.783	38.635
P794	B&B Poultry Co., Inc.	Norma	NJ	-75.085	39.499
P7942	Gino's Bar-B-Q Inc	Smithville	TN	-85.836	35.96
P7945	Southern Packing Corp.	Chesapeake	VA	-76.202	36.577
P7946	Uncle Charlie's Meats	Richmond	KY	-84.282	37.75
P795	Monogram Meat Snacks, LLC	Martinsville	VA	-79.871	36.731
P7953	Southeastern Meats, Inc.	Chattanooga	TN	-85.191	35.033
P7958	Knott's Wholesale Foods	Paris	TN	-88.32	36.304
P795B	Monogram Snacks	Martinsville	VA	-79.874	36.728
P7964	Columbia Meats. Inc.	West Columbia	SC	-81.11	33.947
P7966A	NEW B & M Meats, Inc.	Wilmington	DE	-75.538	39.735
P7975	Piedmont Custom Meats, Inc.	Gibsonville	NC	-79.521	36.254
P7975A	Piedmont Custom Meats, Inc.	Asheboro	NC	-79.844	35.684
P7987	Amick Farms LLC.	Batesburg	SC	-81.638	33.957
P7991	Nestle Prepared Foods Company	Gaffney	SC	-81.685	35.053
P7995	Empire Packing Company LP	Memphis	TN	-90.111	35.097
P8001	Lewis Sausage Co., Inc.	Burgaw	NC	-77.932	34.564
P8002	Fishmarket Inc.	Louisville	KY	-85.775	38.25
P8005	Bloemer Food Sales Co.	Louisville	KY	-85.764	38.242
P8016	Keith Valley Packing Company - A Division of Ben E. Keith	Elba	AL	-86.088	31.394
P802	Miller Packing Company	Lodi	CA	-121.253	38.125
P8025	Roger Wood Foods	Savannah	GA	-81.148	32.09
P8028	Smithfield Packaged Meats Corp.	Middlesboro	KY	-83.718	36.599
P8030	Jim David Farm Fresh Meats	Uniontown	KY	-87.901	37.746
P8030A	Mid-South Sales, LLC	Uniontown	KY	-87.903	37.745
P8030B	Little Kentucky Smokehouse	Uniontown	KY	-87.903	37.744
P8039	Campbell Soup Company	Maxton	NC	-79.325	34.774
P806	Tyson Foods, Inc.	Temperanceville	VA	-75.556	37.885
P8066	James Meat Co, Inc	Cookeville	TN	-85.6	36.193
P8069	Royal Foods Co. Inc.	Pell City	AL	-86.277	33.571
P8077	Gourmet Salads & Pickles	Pompano Beach	FL	-80.141	26.228
P8078	Boone's Abattoir, Inc.	Bardstown	KY	-85.46	37.81
P8080	The Hillshire Brands Company	Newbern	TN	-89.271	36.141
P8082	Kirby & Poe Slaughterhouse	Alvaton	KY	-86.339	36.839
P8091	Magnolia Provision Co., Inc.	Knoxville	TN	-83.933	36.016
P8099	Four Star Meat Product Co., Inc.	Forest Park	GA	-84.386	33.598
P810	Pilgrim's Pride Corporation	Moorefield	WV	-78.971	39.059
P8107	Squab Producers Of California	Modesto	CA	-120.989	37.607
P8112	Grand Peaks Prime Meats	Idaho Falls	ID	-112.044	43.48
P8117	Salt Lake Fine Foods	Salt Lake City	UT	-111.891	40.713
P8118	Wasatch Meats, Inc.	Salt Lake City	UT	-111.896	40.749
P8119	Producers Meat & Provision	San Diego	CA	-116.977	32.565
P8120	Wood's Meat Processing, Inc.	Sandpoint	ID	-116.541	48.382
P8124	Steamboat Meat & Seafood Co.	Steamboat Springs	CO	-106.838	40.487
P8126	Old Style Sausage	Louisville	CO	-105.129	39.982
P812A	Sioux Preme Packing Co.	Sioux City	IA	-96.372	42.398
P8131	Blue Ribbon Processing, LLC	Fowler	CO	-104.021	38.131
P8132	Katadyn North America Foods, LLC.	Rocklin	CA	-121.305	38.822
P8139	Red Bird Farms Dist. Co.	Englewood	CO	-105.008	39.671
P8142	R.C. Provisions Inc.	Burbank	CA	-118.322	34.185
P816	Kettle Range Meat Co. LLC	Milwaukee	WI	-87.982	43.044
P8174	Anderson Produce	Roseville	MN	-93.197	45.013
P8180	US Foods, Inc. d/b/a Stock Yards Meat Packing Company	South Saint Paul	MN	-93.031	44.893
P8197	Nitsche's Sausage Co., Inc.	Roseville	MI	-82.924	42.515
P81A	Bar-S Foods Company	Altus	OK	-99.293	34.635
P81B	Bar-S Foods Co.	Mt. Pleasant	IA	-91.522	40.972
P81E	Bar-S Foods Co.	Elk City	OK	-99.388	35.407
P81L	Bar-S Foods Company	Lawton	OK	-98.51	34.599
P8205	Affiliated Fresh Cuts, LLC	Amarillo	TX	-101.817	35.229
P8214	Cajun Original Foods, Inc.	New Iberia	LA	-91.872	30.038
P8219	Gold Crown Food Company of the Ozarks, Inc.	Springfield	MO	-93.253	37.208
P823B	Alsager Meats	Breckenridge	MN	-96.588	46.275
P823N	Alsager Meats	Fargo	ND	-96.882	46.841
P824	Crescent Duck Farm, Inc.'	Aquebogue	NY	-72.621	40.938
P8242	Freedom Sausage, Inc.	Earlville	IL	-88.847	41.537
P8256	Legacy Food Company Inc,	Rancho Cucamonga	CA	-117.572	34.097
P8264	Richwood Meat Co.	Merced	CA	-120.52	37.328
P8271	Panizzera Meat Co.	Occidental	CA	-122.948	38.41
P8274	Pacific Seafood - Sacramento, LLC	Sacramento	CA	-121.495	38.643
P8275	Settlers Jerky Inc.	Walnut	CA	-117.859	34.012
P8276	Innovative Solutions, Inc	Kent	WA	-122.25	47.408
P8280	J&R Meat Company	Porterville	CA	-119.04	36.065
P829	Juniper Creek Farms, LLC	Poplarville	MS	-89.353	30.812
P830	Captain Ken's Foods, Inc.	St Paul	MN	-93.08	44.935
P8302	Lucky Pig Processing, LLC D/B/A Curtis Packing Company	Tifton	GA	-83.504	31.443
P8328	Halperns' Steak and Seafood	Fort Lauderdale	FL	-80.166	26.152
P833	Prasek's Hillje Smokehouse Inc.	El Campo	TX	-96.333	29.157
P8333	Sir Pizza of Tennessee, Inc	Murfreesboro	TN	-86.404	35.836
P8334	Vanguard Culinary Group, Ltd.	Fayetteville	NC	-78.895	35.038
P8337	Catalina Finer Food, LLC	Tampa	FL	-82.518	27.987
P833J	Prasek's Hillje Smokehouse	El Campo	TX	-96.334	29.158
P834	Red Field Ranch	Katy	TX	-95.811	29.785
P836	Les Chateaux DeFrance Inc	Inwood	NY	-73.754	40.614
P8364	Farmers Produce	Chambersburg	PA	-77.708	39.943
P8369	Oaks Poultry Co., Inc.	Stoystown	PA	-78.923	40.136
P838	KW Properties LLC	Creighton	NE	-97.902	42.467
P8388	Imler's Poultry Inc.	Duncansville	PA	-78.436	40.44
P8389	Pasqualichio Brothers, Inc.	Jessup	PA	-75.547	41.465
P839	Fishel's Moravian Style Chicken Pies	Crumpler	NC	-81.349	36.472
P8403	Preston St. Poultry	Louisville	KY	-85.748	38.239
P8404	Stripling's General Store Inc.	Moultrie	GA	-83.806	31.162
P8406	Mennella'a Poultry	Paterson	NJ	-74.157	40.896
P8408	Jo Mar  Provisions Inc.	Pittsburgh	PA	-79.986	40.451
P8413	W.E. Ryan Co., Inc.	Philadelphia	PA	-75.137	39.986
P8417	Spring Glen Fresh Foods, Inc.	Ephrata	PA	-76.139	40.175
P8419	DAIRY MAID RAVIOLI MFG. CORP.	BROOKLYN	NY	-73.976	40.597
P8422	Schiff's Restaurant Service, Inc.	Scranton	PA	-75.639	41.449
P8426	Tower Isles Frozen Foods, Ltd.	BROOKLYN	NY	-73.914	40.677
P8427	Hummel Brothers, Inc.	New Haven	CT	-72.924	41.296
P8428	City Beef Company Inc	Trenton	NJ	-74.767	40.225
P8429	Aldon Food Corporation	Schwenksville	PA	-75.414	40.242
P843	Pilgrim's Pride Corporation	Marshville	NC	-80.392	34.986
P8437	Koch's Turkey Farm	Tamaqua	PA	-76.035	40.726
P844	ELP Franklin Foods Inc	El Paso	TX	-106.392	31.818
P8447	Old World Provisions Inc.	Troy	NY	-73.676	42.706
P8452	American Food Systems, Inc.	Burlington	MA	-71.223	42.498
P8465	Berger Wholesale Meat Co.	Huntington	NY	-73.428	40.87
P8466	Catelli Brothers	Sutton	MA	-71.731	42.18
P847	Green Tree Foodservice	Passaic	NJ	-74.129	40.866
P8489	Baretta Provision, Inc.	East Berlin	CT	-72.717	41.623
P8498	Brenneman's Meat Market Inc	Huntingdon	PA	-78.028	40.488
P850	Turkey Coop Group	Camden	SC	-80.53	34.225
P8507	IRP Meat & Seafood, CO	Telford	PA	-75.324	40.335
P851	Patla Enterprises, Inc.	Rome	NY	-75.59	43.21
P8514	Miller Foods, Inc	Avon	CT	-72.861	41.801
P8536	Century Frozen Foods, LLC	Carolina	PR	-65.986	18.43
P8540	Weiss Brothers Inc.	Pittsburgh	PA	-79.973	40.331
P8542	Fisher's Meats Lewisburg, LLC	Lewisburg	PA	-76.886	40.966
P8543	Troutmans Meats and Supplies	Middleburg	PA	-77.048	40.792
P8544	Chinese Spaghetti Factory	Boston	MA	-71.067	42.329
P855	Pilgrim's Pride Corporation	Athens	GA	-83.387	33.973
P8554	Eatem Corporation	Vineland	NJ	-75.056	39.537
P8556A	PEN LLC	New Holland	PA	-76.089	40.093
P855D	Pilgrim's Pride Corporation	Athens	GA	-83.388	33.973
P856	Bud Antle	Bessemer City	NC	-81.255	35.281
P8560	Juniata Packing Co. / CCK Inc.	Tyrone	PA	-78.256	40.661
P8560A	Juniata Packing Co. / CCK, Inc.	Tyrone	PA	-78.255	40.663
P8566	Hazle Park Packing Co.	West Hazleton	PA	-75.999	40.964
P857	Wholesome Foods, Inc.	Edinburg	VA	-78.59	38.821
P8570	Ragozzino Foods, Inc	Meriden	CT	-72.812	41.543
P8570A	Ragozzino Foods, Inc.	Meriden	CT	-72.815	41.541
P8575	Pellegrino Food Products Co., Inc.	Warren	PA	-79.138	41.854
P85M	Cargill Meat Solutions Corporation	Marshall	MO	-93.247	39.118
P8603	Attilio Esposito Inc.	Philadelphia	PA	-75.158	39.937
P8609	Wilmington Slaughter	New Wilmington	PA	-80.323	41.124
P8615	Hi-Way Meat Market	Womelsdorf	PA	-76.225	40.38
P8630	Benner's Butcher Shoppe, LLC	Thompsontown	PA	-77.226	40.567
P8638	Specialty Steak Service	Erie	PA	-80.042	42.139
P864	Aunt Kitty's Foods Inc	Vineland	NJ	-75.064	39.492
P8642	Economy Locker, LLC	Muncy	PA	-76.792	41.248
P8665	Rebhan R&W Meat Co. Inc.	St. Louis	MO	-90.218	38.59
P8681	Dan's Country Meats	New Melle	MO	-90.879	38.711
P8687	Bonne Terre Meat Company	Bonne Terre	MO	-90.534	37.92
P8689	House Of Sausage	Kansas City	KS	-94.624	39.111
P8696	Jennings Premium Meats, Inc.	New Franklin	MO	-92.736	39.017
P8699	Wright City Meat	Wright City	MO	-91.0	38.826
P86A	Cargill Meat Solutions	West Columbia	SC	-81.091	33.937
P86C	Cargill Meat Solutions	Columbus	NE	-97.308	41.435
P86F	Cargill Meat Solutions	Fort Worth	TX	-97.333	32.774
P86G	Cargill Meat Solutions Corporation	Newnan	GA	-84.75	33.411
P86P	Cargill Beef	Hazleton	PA	-76.1	40.913
P86X	Cargill Meat Solutions, Corp.	Wichita	KS	-97.341	37.689
P8701	John Graves Food Service	Chillicothe	MO	-93.543	39.78
P871	Marquez Brothers International, Inc.	Montebello	CA	-118.117	34.007
P8711	Matador Foods, LLC	Blanchard	OK	-97.652	35.154
P8713	G&W Meat & Bavarian Style Sausage	St. Louis	MO	-90.269	38.598
P8721	International Dehydrated Foods, Inc.	Monett	MO	-93.902	36.917
P8721B	International Dehydrated Foods, LLC Innovation Center	Monett	MO	-93.902	36.917
P8725	Golden City Meats, L.L.C.	Golden City	MO	-94.096	37.397
P8727	Butterball, LLC	Carthage	MO	-94.311	37.183
P8728A	Jack Stack World Class LLC	Alma	MO	-93.545	39.095
P8732	Lucia's Pizza Manufacturing, LLC	St Louis	MO	-90.411	38.513
P874	Reser's Fine Foods	Halifax	NC	-77.662	36.36
P8740A	The Hillshire Brands Company	St Joseph	MO	-94.758	39.758
P8745	College of the Ozarks Processing Plant	Point Lookout	MO	-93.236	36.621
P8746	Manda Packing Company	Baton Rouge	LA	-91.181	30.468
P874A	USU Meat Laboratory	Logan	UT	-111.804	41.745
P875	Gourmet Republic	Sun Valley	CA	-118.374	34.229
P8756	DeYulio Sausage Company LLC	Bridgeport	CT	-73.212	41.169
P8757	HVFG, LLC	Mongaup Valley	NY	-74.796	41.696
P8758	Napoli Meat & Sausage Company Co., Inc.	New Haven	CT	-72.921	41.293
P8771	Wohrle's Inc.	Pittsfield	MA	-73.207	42.455
P8772	Theriault's Abattoir, Inc.	Hamlin	ME	-67.906	47.135
P8776	CL Saigon Food Company	Philadelphia	PA	-75.147	39.933
P8777	London Manhattan Corp.	Bronx	NY	-73.872	40.807
P878	Dimension Marketing and Sales, Inc.	Sandy	UT	-111.903	40.581
P8782	Berks Packing Co., Inc.	Reading	PA	-75.932	40.327
P8784	National Packing Corp.	Bronx	NY	-73.892	40.811
P8784A	National Packing FL Inc.	Miami	FL	-80.35	25.793
P8795	VSC Holdings, LLC	Hinesburg	VT	-73.113	44.331
P8804	ALFREDO AIELLO ITALIAN FOODS, INC.	QUINCY	MA	-71.003	42.242
P8805	Wicks Kitchens	Trainer	PA	-75.396	39.827
P881	Wells, Jenkins & Wells	Forest City	NC	-81.836	35.302
P8813	Golden Platter Foods Inc.	Newark	NJ	-74.169	40.717
P882	Nourish Kitchen LLC	Tempe	AZ	-111.965	33.429
P8821	Weis Market's Inc	Sunbury	PA	-76.799	40.855
P8827	WILLOW TREE POULTRY FARM, INC.	Attleboro	MA	-71.316	41.91
P883	Sweet Supplies LLC	Moxee	WA	-120.384	46.555
P8836	International Flavors & Fragrances Inc.	Dayton	NJ	-74.478	40.365
P8839	Warwick Poultry Co., Inc.	Providence	RI	-71.425	41.832
P8848	Better Baked Foods, LLC	North East	PA	-79.83	42.212
P8848A	Better Baked Foods, LLC	Erie	PA	-80.021	42.121
P8855	Wilson Beef Farms LLC	Canaseraga	NY	-77.754	42.464
P8871	Crafted Meats, LLC	Mt Royal	NJ	-75.213	39.809
P8876	NAT KAGAN MEAT & POULTRY, INC.	WOODRIDGE	NY	-74.572	41.71
P8885	Hanover Foods Corp.	Clayton	DE	-75.642	39.287
P8888	John F. Martin & Sons LLC	Stevens	PA	-76.205	40.247
P8888A	John F. Martin & Sons Inc.	Womelsdorf	PA	-76.185	40.37
P8889	Borenstein Caterers Inc.	Jamaica	NY	-73.766	40.656
P8891	Demakes Enterprises, LLC	Lynn	MA	-70.969	42.465
P8892	Haass' Family Butcher Shop, Inc.	Dover	DE	-75.581	39.142
P8895	Wendel's Poultry Farm	East Concord	NY	-78.642	42.539
P8899	George L. Wells Meat Company	Philadelphia	PA	-75.135	39.965
P89	The Hillshire Brands Company	Kansas City	KS	-94.684	39.096
P890	Peco Foods, Inc.	Canton	MS	-90.053	32.61
P8908	Smithfield Packaged Meats Corp.	St James	MN	-94.618	43.989
P8909W	Mary Ann's Speciality Foods, Inc.	Webster City	IA	-93.79	42.472
P8912	New Horizons Food Solutions, LLC.	Columbus	OH	-82.92	40.017
P8915	McDonald's Meats, Inc.	Clear Lake	MN	-93.999	45.445
P8916	St. Joseph Meat Market	St Joseph	MN	-94.32	45.565
P8918	Northland Frozen Pizza, Inc.	Brainerd	MN	-94.196	46.325
P8926	Nueske Applewood Smoked Meats	Wittenberg	WI	-89.152	44.827
P8930A	J.T.M. Provisions Company	Harrison	OH	-84.808	39.251
P8934	Swift Pork Company	Pipestone	MN	-96.287	43.986
P8938	Pep's Pizza Company LLC	Green Bay	WI	-87.931	44.484
P894	The Hillshire Brands Company	Haltom City	TX	-97.289	32.822
P8947	Randy's Foods, LLC	Faribault	MN	-93.297	44.296
P8948	Carlson Meat Shop	Grove City	MN	-94.681	45.152
P8951	Quality Meats and Culinary Specialties	Detroit	MI	-83.118	42.316
P8959	Dombrovski Meats Co. Inc.	Foley	MN	-93.911	45.665
P8979	New Geneva Meats & Processing Inc.	Geneva	MN	-93.267	43.824
P8983	Sysco Western Minnesota, Inc.	St Cloud	MN	-94.144	45.572
P8984	Provimi Foods, Inc.	Seymour	WI	-88.284	44.563
P8984A	Provimi Foods, Inc.	Seymour	WI	-88.315	44.515
P8993	Amylu Foods, LLC	Chicago	IL	-87.659	41.814
P8997	Fraboni Sausage	Hibbing	MN	-92.926	47.437
P8999	Branding Iron Holdings	Rochester	MN	-92.49	44.034
P9	Conagra Brands (Conagra Foods Packaged Foods, LLC)	Marshall	MO	-93.199	39.122
P9002	A. Tarantino & Sons	San Francisco	CA	-122.389	37.726
P9004	California State University, Chico - Meat Lab 9004	Chico	CA	-121.824	39.688
P9006	Value Meats	Vernon	CA	-118.216	33.999
P9007	Badalamente Sausage Co.	San Jose	CA	-121.886	37.316
P9008	Johansen's Quality Meats	Orland	CA	-122.139	39.752
P901	Brother's Halal Meat Packing	Stamford	NY	-74.633	42.402
P9014	Galant Food Co	San Leandro	CA	-122.148	37.705
P9018	Nestle Prepared Foods Company	Springville	UT	-111.607	40.167
P9026	Corfini Meat and Seafood	West Sacramento	CA	-121.58	38.563
P9027	NEW YORK STYLE SAUSAGE CO.	SUNNYVALE	CA	-121.988	37.404
P9029	Pampanga Food Co. Inc.	Anaheim	CA	-117.91	33.863
P9029A	Pampanga Food Company	Anaheim	CA	-117.909	33.862
P9034	Wei-Chuan USA, Inc.	Bell Gardens	CA	-118.149	33.971
P9041	Sturgis Meats LLC	Sturgis	SD	-103.528	44.418
P9057	Kershenstine's Beef Jerky, Inc.	Eupora	MS	-89.286	33.532
P9059	Starnes Wholesale LLC	Paducah	KY	-88.617	37.054
P9062	Walker Foods, Inc.	Carrollton	GA	-85.058	33.549
P9064	Nashville Restaurant Supply	Pleasant View	TN	-87.032	36.395
P9065	Wampler's Farm Sausage Company, Inc.	Lenoir City	TN	-84.322	35.835
P907	Meritage Soups, LLC	Redmond	WA	-122.096	47.667
P9070	Kraft Heinz Foods Company	Newberry	SC	-81.63	34.304
P9099	Perdue Foods, LLC.	Concord	NC	-80.605	35.431
P91	Conagra Brands, Inc.	Archbold	OH	-84.318	41.52
P910	Harrison Poultry, Inc.	Bethlehem	GA	-83.705	33.93
P9101	Chirpy's Barbecue, LLC	Bennett	NC	-79.496	35.525
P9112	Hometown Butcher	Columbia	KY	-85.301	37.064
P912	Wayne Farms LLC	Union Springs	AL	-85.724	32.137
P9120	Homestead Knoxville, LLC	Knoxville	TN	-83.912	35.973
P9122	Prime Food Inc.	Cartersville	GA	-84.833	34.2
P913	Mello's North End Manufacturers	Fall River	MA	-71.152	41.718
P9132	Conagra Brands	Jackson	TN	-88.777	35.635
P9136	House of Raeford Farms, Inc.	Nesmith	SC	-79.574	33.722
P914	Castle Canning, LLC	Sharon	PA	-80.508	41.24
P9141	Koch Foods of Mississippi	Forest	MS	-89.474	32.352
P9145H	Flanders Provision	Hastings	NE	-98.407	40.569
P9147	The Hillshire Brands Company	Alexandria	KY	-84.383	38.91
P9155	Smithfield Packaged Meats Corp.	Grayson	KY	-82.93	38.348
P916	Halsted Street Market, Inc.	Chicago	IL	-87.646	41.825
P9165	Gold Creek Foods LLC	Gainesville	GA	-83.859	34.267
P9179	Uncle John's Pride LLC	Tampa	FL	-82.33	27.953
P9181	Koch Foods of Gainesville GA	Gainesville	GA	-83.828	34.284
P9185	Sunset Farm Foods, Inc.	Valdosta	GA	-83.275	30.815
P919	Hafiz Brothers Inc	Houston	TX	-95.498	29.944
P9196	Walker Meats, Inc.	Carrollton	GA	-85.136	33.549
P9197	Perdue Foods, LLC.	Lewiston Woodville	NC	-77.211	36.144
P9199	SCR International Corp.	Fairmont	NC	-79.112	34.426
P9200	Chalet Market Inc.	Belgrade	MT	-111.184	45.764
P9201	Hill Meat Company	Pendleton	OR	-118.848	45.686
P9202	Columbia Empire Meat Co., Inc.	Portland	OR	-122.653	45.495
P9207	Rocker Bros. Meat & Provision Inc.	Inglewood	CA	-118.349	33.971
P921	Paradise Market	Medina	MN	-93.545	45.044
P9211	T&T Foods, Inc.	Vernon	CA	-118.214	33.998
P9221	Childers Meat Company	Eugene	OR	-123.187	44.113
P9223	Clark Meat Science Laboratory	Corvallis	OR	-123.287	44.566
P9228	Carlton Packing Company	Carlton	OR	-123.204	45.292
P923	Glutenlibre	Carlstadt	NJ	-74.08	40.831
P9237	Reed and Hertig Packing Co	Warrenton	OR	-123.918	46.092
P9246	Crystal Creek Meats	Roseburg	OR	-123.274	43.217
P9251	Family Loompya Corporation	National City	CA	-117.105	32.659
P9252	Bright Oak Meats, Inc.	Springfield	OR	-122.913	44.142
P9264	Malco's Buxton Meat Co	Sandy	OR	-122.281	45.43
P9265	Marks Meat Inc.	Canby	OR	-122.656	45.244
P9267B	BrucePac	Woodburn	OR	-122.843	45.133
P9270	Mt. Angel Meat Co.	Mount Angel	OR	-122.792	45.09
P9271	Jacobellis Meat & Sausage	Burbank	CA	-118.309	34.175
P9288	Gaylord's Meats Co.	Fullerton	CA	-117.911	33.865
P9289	Oregon Beef Co.	Madras	OR	-121.131	44.611
P9295	Tillamook Country Smoker, LLC	Bay City	OR	-123.883	45.517
P9295A	Tillamook Country Smoker, LLC	Tillamook	OR	-123.849	45.458
P9295B	Tillamook Country Smoker	Beaverton	OR	-122.787	45.467
P9301	Jake's Food Service LLC	Vancouver	WA	-122.636	45.655
P9305	Ray's Wholesale Meats, Inc.	Union Gap	WA	-120.509	46.566
P9307	Royal Meat LLC	Everett	WA	-122.215	47.946
P9311	Better Meat Inc.	Seattle	WA	-122.361	47.688
P9314	Claus Meats, Inc.	Bellingham	WA	-122.475	48.761
P932	West Georgia Processing	Carrollton	GA	-85.14	33.656
P9325	ZYK Enterprises, Inc.	Duvall	WA	-121.982	47.756
P9326	MacDonald Meat Company, Inc.	Seattle	WA	-122.322	47.579
P9332	Diestel Turkey Ranch	Sonora	CA	-120.334	38.025
P9332A	Diestel Turkey Ranch	Chinese Camp	CA	-120.468	37.877
P9344	Los Hernandez Tamales LLC	Moxee	WA	-120.393	46.561
P935	Allen Harim LLC	Harbeson	DE	-75.288	38.72
P936	Hometown Meat Market LLC	Luling	TX	-97.657	29.729
P9364	Schiff's Food Service, Inc.	Easton	PA	-75.202	40.68
P9366	McDonald Meats Inc.	Girard	PA	-80.348	41.993
P9369	Froehlich Packing Company	Johnstown	PA	-78.945	40.339
P9370	Smith Provision Company, Inc.	Erie	PA	-80.118	42.102
P9378	Baffoni's Poultry Farm Inc.	Johnston	RI	-71.489	41.839
P9379A	K. Heeps, Inc.	Allentown	PA	-75.574	40.593
P9380	Bierly's Meat Market	Spring Mills	PA	-77.575	40.852
P9385	Green Valley Packing Co Inc	Claysville	PA	-80.356	40.147
P9387	FED-RICK VEAL CO.	PROVIDENCE	RI	-71.428	41.821
P938A	Tj's Pizza Company	St. Louis	MO	-90.197	38.754
P939	Arlindo Catering Inc.	Newark	NJ	-74.165	40.717
P94	Henningsen Foods, Inc	Norfolk	NE	-97.41	42.037
P9400	Cargill Meat Solutions Corporation	Wyalusing	PA	-76.25	41.683
P9410	Cunningham Meats LLC	Indiana	PA	-79.25	40.632
P9423	Steely Meats	Fayetteville	PA	-77.559	39.915
P9428	East Conway Beef and Pork Processing	East Conway	NH	-70.999	44.034
P9432	US Foods, DBA Stock Yards Meat Packing Co.	Greensburg	PA	-79.567	40.29
P9434	European American Sausage Corp.	Philadelphia	PA	-75.14	39.971
P9442	Groff Meats Inc.	Elizabethtown	PA	-76.606	40.152
P9457	MRG Food LLC	McKeesport	PA	-79.879	40.344
P9476	Fox Country Smoke House LLC	Canterbury	NH	-71.52	43.382
P9491	Silver Star Meats, Inc.	Coraopolis	PA	-80.215	40.453
P9495	TASTE-RITE CO. INC.	PEACE DALE	RI	-71.499	41.451
P950	Texas Best Protein	Santo	TX	-98.112	32.614
P9503	Rocca's Italian Foods	New Castle	PA	-80.345	40.994
P9505	B & M Provisions Co.	Allentown	PA	-75.447	40.625
P9515	Elk Provision Co., Inc.	Buffalo	NY	-78.829	42.876
P9520	Leidy's, LLC	Souderton	PA	-75.32	40.3
P9532	Graziano Gourmet Foods	Providence	RI	-71.421	41.858
P9538	Ken Weaver Meats, Inc.	Wellsville	PA	-76.944	40.053
P954	Buona Vita Inc.	Bridgeton	NJ	-75.212	39.412
P9542	Lemay and Sons Beef, LLC	Goffstown	NH	-71.521	42.992
P9548	Wayne Nell & Sons Meats Inc.	East Berlin	PA	-76.97	39.949
P9553	Godshall's Quality Meats Inc.	Telford	PA	-75.385	40.298
P9574	Dietz and Watson Inc.	Philadelphia	PA	-75.057	40.01
P9574B	Dietz & Watson, Inc.	Baltimore	MD	-76.657	39.326
P9587	Exceptional Foods Inc	Pennsauken TWP	NJ	-75.027	39.976
P959	Peninsula Foodservice	Orlando	FL	-81.429	28.509
P9591	Astra Foods, Inc.	Upper Darby	PA	-75.251	39.963
P9591A	Astra Foods, Inc.	Aston	PA	-75.408	39.849
P96	Knauss Foods	Quakertown	PA	-75.325	40.44
P9602	Shields Meats & Produce, Inc.	Kennebunk	ME	-70.557	43.366
P961	Pitman Farms	California	MO	-92.553	38.629
P9617	Henry Grasso Co., Inc.	Pittsburgh	PA	-79.911	40.467
P9627	Weiss Provision Company	Pittsburgh	PA	-79.975	40.458
P963	Cargill Meat Solutions	Springdale	AR	-94.122	36.204
P9640	Olde Tyme Meats, LLC	Chambersburg	PA	-77.679	39.962
P9646	Stoney Point Butchery, Inc.	Littlestown	PA	-77.11	39.734
P965	Interstate Meat Dist., Inc.	Clackamas	OR	-122.565	45.405
P965A	Interstate Meat Dist., Inc.	Clackamas	OR	-122.556	45.411
P966	Lower Foods Inc.	Richmond	UT	-111.815	41.909
P9662	E. W. Mailhot Sausage Co.	Lewiston	ME	-70.207	44.092
P9672	Al-Marwa L. L. C.	Quakertown	PA	-75.345	40.473
P9675	Panhandle Food Sales Inc.	Slovan	PA	-80.389	40.364
P9681	Clair D Thompson & Son's Inc	Jersey Shore	PA	-77.259	41.203
P9684	KFS LFG, LLC	Millerton	PA	-77.016	41.943
P9687	Bixler Country Meats, Inc.	Hegins	PA	-76.583	40.649
P9691	Ricci's Italian Sausage, Inc.	McKees Rocks	PA	-80.097	40.474
P9714	Thoma Meat Market	Saxonburg	PA	-79.833	40.75
P972	Transylvania Meat Co Inc	Skokie	IL	-87.716	42.017
P975	New Braunfels Smokehouse	New Braunfels	TX	-98.133	29.7
P9760	Herring Brothers, Inc.	Guilford	ME	-69.32	45.176
P9760A	Herring Brothers, Inc.	Guilford	ME	-69.321	45.177
P9764	Mr. Pastie	Pen Argyl	PA	-75.255	40.869
P9771	T.A.I.F., Inc	Folcroft	PA	-75.271	39.89
P9784	Leona Meat Plant Inc	Troy	PA	-76.738	41.797
P9791	Denver Meats Company	Denver	PA	-76.137	40.232
P9792	Stoltzfus Meats Inc.	Gordonville	PA	-76.1	40.036
P980	One90 BBQ LLC	Dallas	TX	-96.714	32.797
P9814	Twin Pine Farm Inc.	Seven Valleys	PA	-76.776	39.876
P9815	Sandridge - PA, LLC	New Oxford	PA	-77.049	39.86
P9819	Cabin Hollow Butcher Shop, Inc	Dillsburg	PA	-77.042	40.078
P9822	J. L. Miller  & Sons Inc.	York	PA	-76.745	39.92
P9823	Laudermilch Meats Inc	Annville	PA	-76.535	40.325
P9844	Penn State Meat Lab	University Park	PA	-77.854	40.813
P9849	W. A. Bean & Sons, Inc.	Bangor	ME	-68.783	44.851
P9862	Herfurth Brothers Inc	Gilbert	PA	-75.441	40.915
P987	Whitsons Food Services (Bronx), LLC	Brooklyn	NY	-74.022	40.647
P9870	Schiff's Food Service	Taylor	PA	-75.702	41.393
P9882A	Busseto Foods	Fresno	CA	-119.833	36.761
P9887	Camino Real Foods, Inc.	Vernon	CA	-118.225	34.005
P9897	New Stockton Poultry	Stockton	CA	-121.286	37.95
P9899	Bakersfield Meat Company	Bakersfield	CA	-119.002	35.334
P990	Hawa Corp.	Colton	CA	-117.323	34.081
P9900	Lipari's Sausage Inc.	Hawthorne	NJ	-74.151	40.965
P9903	Miller's Quality Meats, LLC	Butler	PA	-79.896	40.862
P9912	Westside Distributors, LLC	Rio Grande	NJ	-74.876	39.024
P9917	Philadelphia Poultry Incorporated	Philadelphia	PA	-75.14	39.957
P9919	Peking Food LLC	Brooklyn	NY	-73.926	40.708
P992	JoBurg Meats, LLC	Woodbridge	CT	-72.978	41.344
P9932	Smithfield Fresh Meats Corp.	Smithfield	VA	-76.63	36.995
P9952	Buitoni USA LLC	Danville	VA	-79.313	36.572
P9970	Sammy's Poultry, LLC	Lancaster	PA	-76.214	40.064
P9979	Smith Valley Meats	Rich Creek	VA	-80.822	37.391
P998	Butcher Block Meats	Dilworth	MN	-96.683	46.879
P9992	Daniele Operating, LLC - Daniele	Pascoag	RI	-71.686	41.936
V10	Buckhead Meat & Seafood of Houston.	Houston	TX	-95.418	29.917
V10002	Dearborn Sausage Company Inc	Dearborn	MI	-83.147	42.304
V10038	Scotts Hook & Cleaver Inc.	Scotts	MI	-85.393	42.192
V10047	Rainbow Packing Inc.	Escanaba	MI	-87.191	45.798
V10061	Weltin Meat Packing Inc.	Minden City	MI	-82.769	43.677
V10114	C. Roy, Inc.	Yale	MI	-82.789	43.122
V10147	Countryside Quality Meats LLC	Union City	MI	-85.129	42.055
V1015	Empire Kosher Poultry, Inc.	Mifflintown	PA	-77.398	40.56
V1017	CJ Logistics America LLC (B&G Foods)	Fontana	CA	-117.518	34.049
V1025	5R Custom Meats	Mt. Vernon	AR	-92.092	35.226
V10251	Ernst Hotel Supply Co.	Detroit	MI	-83.04	42.349
V10301	Walsh Packing Company	Pigeon	MI	-83.282	43.829
V10306	Michigan Brand, Inc.	Bay City	MI	-83.88	43.576
V10306F	Michigan Brand Inc.	Frankenmuth	MI	-83.732	43.316
V1036	Americold Logistics LLC.	Vineland	NJ	-75.066	39.513
V1037	Michael's Provision	Fall River	MA	-71.152	41.721
V104	OSI Industries, LLC	West Chicago	IL	-88.232	41.894
V1046	S & S Meat Co.	Kansas City	MO	-94.552	39.118
V104I	OSI Industries, LLC	Oakland	IA	-95.387	41.33
V105	MTC Logistics, Inc.	Mobile	AL	-88.046	30.666
V1055	Rudolph Foods Company, Inc.	Lima	OH	-83.982	40.696
V1058	ConAgra Brands, Inc.	Council Bluffs	IA	-95.85	41.251
V10620	G.E. Hawthorn Meat Company, Inc.	Hot Springs	AR	-92.999	34.497
V10650	Key's Family Butcher Shop	Van Buren	AR	-94.336	35.479
V1067	Cargo International Consolidators Inc.	Miami	FL	-80.392	25.796
V1074	Norpaco Inc.	Middletown	CT	-72.723	41.585
V10754	Brimhall Foods Co., Inc	Bartlett	TN	-89.813	35.208
V1079	Allen Brothers, Inc	Chicago	IL	-87.646	41.826
V1083	Northern MN Meat Co.	Mt. Iron	MN	-92.74	47.49
V10835	Sudlersville Frozen Meat Locker	SUDLERSVILLE	MD	-75.855	39.188
V1100	Illinois Tamale Company	Chicago	IL	-87.735	41.984
V11027	Rammell Valley Pack	Tetonia	ID	-111.16	43.826
V1103	Merchants Distributors LLC	Hickory	NC	-81.387	35.773
V11032	Northwest Premium Meats, LLC	Nampa	ID	-116.514	43.584
V11044	University of Idaho Meats Lab	Moscow	ID	-117.024	46.728
V11061	Meridian Meat and Sausage	Meridian	ID	-116.391	43.608
V11070	Mickelsen Pack	Blackfoot	ID	-112.375	43.182
V112	Lineage Logistics PFS, LLC	Logan Township	NJ	-75.347	39.789
V1126A	Shepherds Processed Eggs	Spanish Fork	UT	-111.737	40.115
V1127	M.G. Waldbaum Company	Lenox	IA	-94.565	40.869
V1141	Wabash Valley Produce, Inc.	Farina	IL	-88.778	38.829
V1158	K Brand Marine	Miami	FL	-80.188	25.947
V116	Celebrity Foods Division of Atalanta Corporation	Elizabeth	NJ	-74.176	40.651
V1163	Unibright Foods, Inc.	Bell Gardens	CA	-118.139	33.966
V1164	Newport Meat Pacific Northwest	Portland	OR	-122.496	45.557
V1174	RCF, LLC dba Gemstone Foods, LLC	Decatur	AL	-86.978	34.605
V1183	Deb El Food Products, LLC	Elizabeth	NJ	-74.19	40.659
V1189	Waltkoch Ltd	Gainesville	GA	-83.757	34.237
V118A	Maid-Rite Specialty Foods, Inc	Dunmore	PA	-75.611	41.435
V1198A	Omaha Steaks International Inc.	Omaha	NE	-96.056	41.217
V121	RSF Inc. "DBA" Freezpak Logistics	Elizabeth	NJ	-74.203	40.687
V1221W	Mary Ann's Speciality Foods, Inc.	Webster City	IA	-93.79	42.472
V1226	World Wide Air Marine	Hialeah	FL	-80.291	25.838
V123	Lineage Logistics, LLC	Portsmouth	VA	-76.343	36.863
V1232	Dependable Warehousing & Dist. Inc.	Miami	FL	-80.244	25.842
V1237	A.M.L.L Corp	Hialeah Gardens	FL	-80.326	25.863
V124	R M Felt's Packing Company	Ivor	VA	-76.896	36.909
V12426	Andrade Slaughterhouse	Lawai Kauai	HI	-159.498	21.923
V12436	Wong's Meat Market Holdings, LLC	Honolulu	HI	-157.876	21.306
V1244	R.C. Provisions Inc.	Burbank	CA	-118.322	34.185
V12455	Sanchez Slaughterhouse	Kapaa Kauai	HI	-159.364	22.066
V12455A	Wailua Meat Company LLC	Kapaa Kauai	HI	-159.363	22.066
V1254	Koch Foods of Ashland, LLC	Ashland	AL	-85.819	33.284
V1256	Newburgh Egg Corp	Woodridge	NY	-74.57	41.71
V1260	Rich Products Corporation	Gallatin	TN	-86.453	36.384
V1260A	Rich Products Corporation	Murfreeboro	TN	-86.383	35.798
V1290	SOPAKCO Packaging	Bennettsville	SC	-79.683	34.612
V1294	Holmes Foods Inc.	Nixon	TX	-97.769	29.266
V1297	Vanee Foods Company	Berkeley	IL	-87.904	41.893
V1297A	Vanee Foods Company	Broadview	IL	-87.864	41.853
V13016	City Meat Steak Co., Inc.	Houston	TX	-95.336	29.752
V13025	Quality Pork International Inc.	Omaha	NE	-96.077	41.22
V1304A	Farmers Pride, Inc.	Fredericksburg	PA	-76.405	40.45
V1304B	Farmers Pride, Inc.	Fredericksburg	PA	-76.411	40.443
V1305	Holly Poultry, LLC	Baltimore	MD	-76.642	39.268
V13081	Tri State Meats LLC DBA Special D Meats	Macon	MO	-92.467	39.767
V1311B	JBS Souderton, Inc.	Souderton	PA	-75.341	40.294
V13128B	Diversified Foods & Seasonings, L.L.C.	Madisonville	LA	-90.187	30.462
V13149	Krehbiels Specialty Meats Inc	McPherson	KS	-97.624	38.409
V1317	Wayne Farms LLC	Albertville	AL	-86.201	34.258
V13170	Oklahoma City Meat Company	Oklahoma City	OK	-97.532	35.464
V13172	Intermex Products USA, LTD.	Grand Prairie	TX	-97.043	32.789
V13174A	Amy Food Inc.	Houston	TX	-95.239	29.671
V13182	Lineage Logistics, LLC	Omaha	NE	-95.951	41.2
V1319	Chef's Fresh Foods	Mendota	CA	-120.385	36.762
V1321	Porkie Co. Of Wis., Inc.	Cudahy	WI	-87.871	42.959
V13276	Bottomland Prime, LLC	Amarillo	TX	-101.91	35.073
V1334	Favpep LLC	Miami	FL	-80.352	25.787
V1335	Cross Point Forwarding, LLC	Hidalgo	TX	-98.233	26.187
V13369	George's Processing, Inc.	Cassville	MO	-93.92	36.744
V1342	Hartley Cold Services LLC	Hartley	IA	-95.476	43.179
V13432A	Martin Foods, L.P.	Houston	TX	-95.379	29.776
V13445	Huse's Processing Inc.	Malone	TX	-96.924	31.931
V13453	Hudson Meat Market	Austin	TX	-97.751	30.246
V13456	Tyson Foods, Inc.	Pine Bluff	AR	-92.076	34.264
V13484A	Direct Source Meats - Cooked	San Antonio	TX	-98.407	29.439
V13517	Southern Wild Game Holdings LLC	Devine	TX	-98.905	29.096
V13535	Lineage Logistics LLC	El Paso	TX	-106.376	31.92
V13575	Ridgeway Freezer Inc	Ridgeway	MO	-94.006	40.383
V13584	George's Further Processing	Springdale	AR	-94.135	36.17
V13597	Seaboard Foods, LLC	Guymon	OK	-101.449	36.718
V138	Conagra Brands (ConAgra Foods Packaged Foods, LLC)	Fayetteville	AR	-94.178	36.05
V1380	Suzanna's Kitchen	Suwanee	GA	-84.03	34.034
V1384	Ritter Foods, LLC	Philadelphia	PA	-75.153	39.905
V1394	OFD Foods LLC	Albany	OR	-123.111	44.614
V1394I	Oregon Freeze Dry, Inc.	Tangent	OR	-123.106	44.552
V140	Conagra Brands, Inc.	Archbold	OH	-84.318	41.52
V1400	American Butchery	Santo	TX	-98.109	32.62
V1403	Otto's Meats, LLC	Luxemburg	WI	-87.702	44.53
V1407	East Texas Beef Processors	Frankston	TX	-95.554	32.062
V1412	AFS American Food Services, Inc.	Jacksonville	FL	-81.562	30.437
V1438	Sierra Meat and Seafood	Reno	NV	-119.752	39.505
V1455	M.G. Waldbaum Company	Gaylord	MN	-94.197	44.557
V1487	Palermo Villa, Inc.	Milwaukee	WI	-87.957	43.027
V1489	Tyson Refrigerated Processed Meats, Inc.	Houston	TX	-95.279	29.784
V1499	Pelkins Smokey Meat Market	Crivitz	WI	-87.996	45.218
V1557	MacDonald Meat Company, Inc.	Seattle	WA	-122.322	47.579
V1562	The Center Cut Slaughter and Meat Processing	Farmington	MO	-90.458	37.824
V157	Sailer's Food Market and Meat Processing	Elmwood	WI	-92.153	44.78
V15724	Case Farms Processing	Winesburg	OH	-81.684	40.614
V1573	QF Southeast, LLC with DBAs as Quirch and Phoenix Logistics	Winter Haven	FL	-81.732	27.989
V15735	FULTON MARKET	Chicago	IL	-87.737	41.815
V1575	Ventura Foods LLC	Albert Lea	MN	-93.351	43.624
V15768	Miltona Custom Meats Inc.	Miltona	MN	-95.286	46.045
V15772	Sensient Flavors LLC	Harbor Beach	MI	-82.648	43.845
V15805	J&B Wholesale Distributing Inc.	St Michael	MN	-93.62	45.215
V15815A	Miracapo Pizza Company LLC	Gurnee	IL	-87.898	42.387
V15815B	Miracapo Pizza Company LLC	Elk Grove Village	IL	-87.948	41.998
V15826	Keystone Meats Inc.	Lima	OH	-84.038	40.732
V1586	TMB East LLC	Kaukauna	WI	-88.284	44.244
V15893	AmeriQual Group, LLC	Evansville	IN	-87.552	38.143
V15893A	AmeriQual Packaging	Evansville	IN	-87.566	37.994
V15893C	Arc Industries	Evansville	IN	-87.481	38.0
V15893D	AmeriQual Distribution Center	Evansville	IN	-87.527	38.026
V15899	Hearthside Food Solutions, LLC	Lakeville	MN	-93.222	44.633
V1591	Mudpond Farm	Dalton	PA	-75.675	41.613
V1602	Cal-Maine Foods, Inc.-Indiana Egg Products	Warsaw	IN	-85.967	41.233
V161	Brakebush Brothers, Inc.	Westfield	WI	-89.487	43.818
V1612	Marshall Egg Products Company	Marshall	MO	-93.21	39.122
V1619	Pacific Fresh Cold Storage	McAllen	TX	-98.287	26.149
V1620	Deb El Food Products, LLC	Thompsonville	NY	-74.61	41.671
V1623A	Ajinomoto Foods North America, Inc.	Carthage	MO	-94.315	37.101
V1626	Anderson Boneless Beef	Denver	CO	-104.957	39.824
V1627A	West Lake Food Corporation	Santa Ana	CA	-117.902	33.747
V1627B	Craftory	Houston	TX	-95.364	29.969
V1633	Abbyland Foods, Inc.	Abbotsford	WI	-90.311	44.942
V1642	The Meat House	Andover	SD	-97.888	45.414
V1648	Lamex Foods Inc.	Commerce	CA	-118.15	33.995
V1649	Foodirect, Inc.	Bronx	NY	-73.872	40.807
V165	Bachoco OK Foods	Fort Smith	AR	-94.385	35.423
V1651	RSF Inc dba FreezPak Logistics	Woodbridge	NJ	-74.274	40.585
V1655	Rashbe Holdings, Inc.	Birdsboro	PA	-75.828	40.277
V165M	Bachoco OK Foods	Muldrow	OK	-94.584	35.41
V165S	Bachoco OK Foods	Fort Smith	AR	-94.385	35.424
V1664	Kah and Company Incorporated	Wapakoneta	OH	-84.18	40.578
V1670	Lineage Logistics, LLC	McAllen	TX	-98.275	26.155
V1675	Oxford Packing LLC	Downey	ID	-112.15	42.431
V1681	Key Cargo Marine/ Kenneth Santos	Jacksonville	FL	-81.644	30.411
V1682A	Nestle USA. INC.	Schamburg	IL	-88.063	42.073
V1684	Jenniges Meat Processing Inc	Brooten	MN	-95.132	45.502
V1685	Lineage Logistics, LLC	Windsor	CO	-104.856	40.456
V1686	Wiley Processing, LLC	Wiley	CO	-102.652	38.216
V1692	TurnRoad LLC	Chattanooga	TN	-85.282	35.134
V1696	Papineau Locker	Papineau	IL	-87.719	40.97
V1698	Schreiber Processing Corporation	Maspeth	NY	-73.909	40.725
V17068	United States Cold Storage, Inc.	Lumberton	NC	-79.041	34.609
V17086	Frontiere Natural Meats, LLC	Denver	CO	-104.976	39.788
V17095	Boesl Packing Co., Inc.	Baltimore	MD	-76.579	39.318
V171	Moweaqua Packing Plant	Moweaqua	IL	-89.019	39.631
V17151	UW Provision Company, Inc.	Middleton	WI	-89.535	43.101
V1720	Medicine Lodge Meat Company LLC	Medicine Lodge	KS	-98.589	37.284
V17202A	Americold Logistics, LLC	Sioux City	IA	-96.371	42.427
V17217A	Plymouth Poultry Co.	Auburn	WA	-122.231	47.338
V17223	Lineage Logistics, LLC	Batavia	IL	-88.288	41.863
V1726	Tomoe Food Services, Inc.	Bronx	NY	-73.872	40.807
V17276	Tyson Sales and Distribution, Inc.	Russellville	AR	-93.066	35.26
V17280	JBS Prepared Foods - Swanton Facility	Swanton	VT	-73.128	44.928
V17281	Yoder Meats, Inc.	Shipshewana	IN	-85.58	41.672
V17339	Marketplace Deli Products Inc.	Glendale	AZ	-112.175	33.52
V17354	Central Storage & Warehouse Co	Madison	WI	-89.309	43.083
V1738	Monogram Gourmet Foods	Haverhill	MA	-71.124	42.787
V17410	Deutschland Foods, Inc.	Lindstrom	MN	-92.847	45.39
V17449	Van Hessen USA Inc.	Santa Fe Springs	CA	-118.065	33.954
V1745	Maple Brook Packing	New Milford	CT	-73.421	41.592
V17459	Interstate Cold Storage, Inc.	Columbus	OH	-83.103	40.002
V1747	Hawkeye Smokehouse Partners LLC	Burlington	IA	-91.15	40.802
V17479	Fair Oaks Foods, LLC	Pleasant Prairie	WI	-87.899	42.535
V17479T	Fair Oaks Foods, LLC	Pleasant Prairie	WI	-87.915	42.527
V17497	Lineage Logistics, LLC	McAllen	TX	-98.272	26.147
V17505	Triland Foods, Inc.	Sergeant Bluff	IA	-96.361	42.408
V1753	HB Exports	Pharr	TX	-98.2	26.103
V17530A	3 Little Pigs	Wilkes-Barre	PA	-75.925	41.202
V17534	Americold	Gainesville	GA	-83.804	34.247
V17534A	Americold Logistics LLC	Pendergrass	GA	-83.672	34.159
V17534B	Americold	Cartersville	GA	-84.792	34.233
V17564F	Indiana Packers Corporation	Frankfort	IN	-86.5	40.284
V17604	Americold Logistics	Montgomery	AL	-86.362	32.315
V17626A	Crystal Distribution Services, Inc	Waterloo	IA	-92.322	42.491
V17634	M.G. Waldbaum Company	Gaylord	MN	-94.197	44.557
V17643	Cuisine Solutions Inc.	ALEXANDRIA	VA	-77.108	38.807
V17644	Request Foods Inc.	Holland	MI	-86.102	42.832
V17644A	Request Foods Inc.	Holland	MI	-86.1	42.835
V17658	Arch Foods, Inc.	Union	NJ	-74.302	40.693
V17666	Weighmasters Murphy, Inc.	Long Beach	CA	-118.214	33.782
V17669	Kerry Stock & Broth Company Inc.	Harrisonburg	VA	-78.861	38.474
V1768	IceCap Cold Storage	Council Bluffs	IA	-95.871	41.246
V17683	National Cold Storage, Inc.	Bonner Springs	KS	-94.919	39.007
V17685	Sysco Eastern Maryland, Inc.	Pocomoke	MD	-75.598	38.08
V1769	Temptee Brand Steak, Inc.	Denver	CO	-104.964	39.804
V17708	Logistic Services, LLC	Eldridge	IA	-90.577	41.629
V17756	Americold Logistics LLC	Sioux City	IA	-96.376	42.426
V17787	Americold Logistics	Compton	CA	-118.222	33.849
V17789B	RMH Foods, LLC	Morton	IL	-89.485	40.609
V17807	Food Ingredients Technology Company, LLC	Anniston	AL	-85.772	33.619
V17810	Stevens Brothers, LLC	Panama	NY	-79.499	42.017
V17820	Sunset Foods	West Des Moines	IA	-93.727	41.565
V17864	United States Cold Storage of CA	Tulare	CA	-119.336	36.187
V17872	Circle Pines Sausage Haus, Inc.	Circle Pines	MN	-93.171	45.136
V17876	Greenco Industries, Inc.	Monroe	WI	-89.662	42.597
V17879	Americold dba Nordic Logistics and Warehousing LLC	Lebanon	TN	-86.272	36.184
V1788	Steadfast Farms Poultry Processing & Slaughter LLC	Bethlehem	CT	-73.212	41.635
V17887	Carnis Meat Processing LLC	Bismarck	ND	-100.777	46.833
V17891	Custom Food Solutions, LLC	Louisville	KY	-85.566	38.208
V1790	Grecian Delight Foods Inc.	Elk Grove Village	IL	-87.978	42.008
V17941	Americold Logistics	Charlotte	NC	-80.823	35.34
V17966	HVFG, LLC	Ferndale	NY	-74.743	41.753
V17978	Bonavista foods Inc.	Ovid	NY	-76.831	42.681
V17982	Michael's Finer Meats, LLC	Columbus	OH	-83.114	40.005
V1799	Seafrigo Cold Storage Miami	Miami	FL	-80.307	25.814
V17993	Lineage Logistics, LLC	Sandston	VA	-77.344	37.508
V17994	Bertolino Foods, Inc.	Peabody	MA	-70.979	42.52
V17D	Smithfield Packaged Meats Corp.	Sioux Falls	SD	-96.72	43.562
V18002	LiDestri Foods, Inc.	Fairport	NY	-77.451	43.107
V18034	Americold Logistics LLC	Chesapeake	VA	-76.371	36.78
V18064	Lineage Logistics, LLC	Attalla	AL	-86.119	33.998
V18073	T.C. Trading Company	Blaine	WA	-122.728	48.99
V18073A	T.C. Trading Company	Blaine	WA	-122.726	48.986
V18079	Smithfield Fresh Meats Corp.	TAR HEEL	NC	-78.803	34.747
V1808	Sherwood Food Distributors LLC	Vernon	CA	-118.18	34.0
V1811	Sorbello Refrigerated Services	Houston	TX	-95.564	29.725
V1812	Cold-Link Logistics Sioux City, LLC	Sioux City	IA	-96.37	42.376
V18125	Northwestern Meat Inc	Miami	FL	-80.23	25.798
V1815	Exel Inc.	Fort Worth	TX	-97.332	32.98
V1816	West Michigan Beef Co. LLC	Hudsonville	MI	-85.857	42.872
V18161	Americold Logistics, LLC	Johnson	AR	-94.17	36.126
V18169	Lee's Meats & Sausage, Inc.	Tea	SD	-96.855	43.462
V18178	Sterling Pacific Meat Co.	Commerce	CA	-118.15	33.979
V18198	Americold Logistics, Inc.	Gadsden	AL	-85.939	33.966
V182	Americold	Mullica Hill	NJ	-75.255	39.721
V18213	Cooper Hatchery, Inc.	Van Wert	OH	-84.57	40.906
V18235	Fresh Foods of Washington LLC	Everett	WA	-122.253	47.943
V1827	Lineage Logistics, LLC	Luverne	MN	-96.234	43.643
V18273	Lineage Logistics	Richland	MS	-90.155	32.255
V18286	Envision Cold	El Paso	TX	-106.292	31.715
V18297	Bellisio Foods, Inc.	Jackson	OH	-82.631	39.055
V18337	A.N. Deringer Inc.	Champlain	NY	-73.455	45.003
V1835	The Country Butcher	Decatur	IN	-84.954	40.822
V18356A	Ajinomoto Windsor Inc.	Portland	OR	-122.642	45.487
V18359	Dreisbach Oakland	Oakland	CA	-122.235	37.78
V18376	Americold Logistics LLC	Le Mars	IA	-96.19	42.772
V18381	Gamez Brothers Produce Co.	Laredo	TX	-99.494	27.512
V18387	At Last Gourmet Foods	Minneapolis	MN	-93.241	44.959
V18389	Orchard Sausages, Inc.	Brooklyn	NY	-73.935	40.707
V18400	Americold Logistics LLC	Houston	TX	-95.384	29.955
V18401	Gosar Natural Foods L.L.C.	Monte Vista	CO	-106.076	37.612
V1841	Sugar Creek Packing Company	Washington Court House	OH	-83.408	39.536
V18412	Dick's Cold Storage	Columbus	OH	-83.085	39.965
V18416	New York Food Service, Inc.	Bronx	NY	-73.873	40.807
V1841C	Sugar Creek Packing Co.	Hamilton	OH	-84.471	39.316
V1841E	Sugar Creek	Cambridge City	IN	-85.152	39.842
V18426	Corky's Food Manufacturing, LP	Memphis	TN	-90.032	35.067
V18435	Lineage Logistics Services, LLC	Tar Heel	NC	-78.804	34.753
V18441	Americold Logistics, Inc.	Fort Smith	AR	-94.409	35.396
V18443B	Stoney Point, Inc.	Littlestown	PA	-77.11	39.731
V18530	Envision Cold	Austin	MN	-92.956	43.685
V18559	Grand Food	Hayward	CA	-122.118	37.622
V1856	Bar-S Foods Co.	Mt. Pleasant	IA	-91.522	40.972
V18564	McLane Foodservices	Riverside	CA	-117.285	33.899
V1857	Cypress Cold Storage, LLC	North Little Rock	AR	-92.249	34.769
V1860	Flex Xray LLC	Vineland	NJ	-75.066	39.513
V1861	Ryder Systems Inc	Lathrop	CA	-121.283	37.812
V18611	Pacific Coast Containers	Oakland	CA	-122.311	37.809
V18618	United States Cold Storage of California	Tracy	CA	-121.408	37.746
V1862	Checker Logistics	Appleton	WI	-88.447	44.247
V18632	Very Good Meat Company	Hudson	SD	-96.454	43.132
V18646D	Coblentz Distributing, Inc	Millersburg	OH	-81.76	40.544
V18669	Midamar Corporation	Cedar Rapids	IA	-91.685	41.919
V18674	Lineage Logistics, LLC	Edwardsville	KS	-94.805	39.057
V18675	Foodbrands Supply Chain Services, Inc.	Olathe	KS	-94.823	38.838
V18678	Fells Point, LLC	Baltimore	MD	-76.659	39.274
V18695	Americold Logistics	Texarkana	AR	-93.998	33.414
V18699	Americold Logistics, LLC	East Dubuque	IL	-90.599	42.468
V18707	Americold Logistics, LLC	Lowell	AR	-94.135	36.263
V1873	Cavutech LLC dba Quality Seafood	Miami	FL	-80.244	25.842
V1877	GFI Colton LLC	Colton	CA	-117.301	34.063
V18770	Wolfson Casing Corp, DBA DCW Casing, LLC	Mount Vernon	NY	-73.826	40.896
V18778	Americold Logistics LLC	Atlanta	GA	-84.607	33.708
V18779	Lineage Logistics HCS, LLC	Stilwell	OK	-94.625	35.803
V1878	Maersk Warehousing & Distribution Services USA LLC	Ridgeville	SC	-80.283	33.141
V18781	Golden Krust Patties Inc.	Bronx	NY	-73.902	40.842
V1879	Lloyd's Barbeque Company, LLC	St. Paul	MN	-93.171	44.866
V18801	Arkansas Refrigerated Services	Fort Smith	AR	-94.429	35.393
V18802	Americold Logistics, LLC	Russellville	AR	-93.093	35.272
V18803	A.G.A. Investments II Inc.	San Diego	CA	-116.958	32.554
V18811	Pacific Transload Systems	Oakland	CA	-122.307	37.817
V18815	N.O.C.S. West Gulf	LaPorte	TX	-95.067	29.696
V18823	Fortune Avenue Foods, Inc.	Ontario	CA	-117.587	34.035
V18831	Campbell Soup Supply Co., LLC	Milwaukee	WI	-87.918	42.953
V18859	North American Bison, LLC	New Rockford	ND	-99.117	47.653
V18869	Americold dba Nordic Logistics and Warehousing LLC	Rockmart	GA	-85.048	34.025
V18895	US Foods Inc.	Hawthorne	CA	-118.361	33.919
V1891	BJ's Wholesale Club Holdings, Inc	Elkton	MD	-75.806	39.653
V18918	Americold Logistics	Albertville	AL	-86.219	34.296
V1893	LoKey Meat Co. LLC	Pulaski	TN	-86.904	35.285
V18935	Givaudan Flavors Corporation	Florence	KY	-84.627	38.965
V18935A	Givaudan Flavors Corporation	Hebron	KY	-84.715	39.057
V18951	Prime Snax Inc.	Salt Lake City	UT	-111.907	40.732
V18958	Smithfield Fresh Meats Corp.	Clinton	NC	-78.31	34.994
V18965	United States Cold Storage	Laredo	TX	-99.51	27.553
V18967	Crider Claxton  LLC	Claxton	GA	-81.903	32.149
V18986	Americold Logistics, LLC	LaPorte	TX	-95.018	29.67
V18988A	Ebels Family Center, Inc.	Falmouth	MI	-85.086	44.243
V18988B	Ebels Meat Processing	Falmouth	MI	-85.086	44.243
V1899	Jensen Meat Company, Inc	San Diego	CA	-116.981	32.553
V18998	White River Cold Storage	Batesville	AR	-91.611	35.805
V18A	Pitman Farms	Mt. Crawford	VA	-78.935	38.377
V19	Lineage Logistics PFS, LLC	San Leandro	CA	-122.152	37.714
V190	Jennie-O Turkey Store, Inc.	Barron	WI	-91.848	45.402
V19034A	Berk Lombardo Packing Co.. Inc.	Hauppauge	NY	-73.225	40.811
V19076	The Wornick Company	Cincinnati	OH	-84.376	39.261
V19076A	The Wornick Company dba Baxters North America, Inc.	Cincinnati	OH	-84.376	39.259
V19076B	The Wornick Company dba Baxters North America, Inc.	Cincinnati	OH	-84.379	39.261
V1908	Easternview Farms LLC	Drakes Branch	VA	-78.548	36.895
V19080	FPL Food, LLC - Freezer Division	Augusta	GA	-81.942	33.455
V19082	Paramount Export Co.	Los Angeles	CA	-118.377	33.943
V19082A	Paramount Export	Los Angeles	CA	-118.234	34.031
V19087	RLS Cold Storage of Pittston PA., Inc.	Pittston	PA	-75.77	41.308
V19096	San Rafael Distributing, Inc.	Nogales	AZ	-110.956	31.355
V19109	Hearthside Food Solutions, LLC	Shakopee	MN	-93.453	44.786
V19111B	Lineage Logistics	Macon	GA	-83.661	32.698
V19113	Stampede Culinary Partners, Inc.	Bridge View	IL	-87.812	41.758
V19113A	Stampede Culinary Partners, Inc.	Oak Lawn	IL	-87.759	41.694
V19113B	Stampede Culinary Partners, Inc.	Bedford Park	IL	-87.797	41.773
V19123	Sysco Food of Central Florida Inc.	Ocoee	FL	-81.548	28.56
V1913A	Three Sons Processing-Texas, Inc.	DFW Airport	TX	-97.016	32.882
V19146	Konoike-Pacific	Wilmington	CA	-118.241	33.794
V19150	La Belle Farm Inc	Ferndale	NY	-74.741	41.744
V19152	Koch Foods LLC	Morristown	TN	-83.296	36.14
V19168	Lineage Logistics, LLC	Tacoma	WA	-122.402	47.246
V19209	Pacific Coast Container, Inc.	Seattle	WA	-122.344	47.57
V19217	Windsor Foods	Tulsa	OK	-95.898	36.099
V19232	Bowman & Landes Turkeys, Inc.	New Carlisle	OH	-84.096	39.912
V19246	Americold Logistics LLC	Sioux City	IA	-96.371	42.427
V19263B	Pulmuone Foods USA Inc.	Mira Loma	CA	-117.521	34.027
V19275	Frez-N-Stor, Inc.	Springdale	AR	-94.134	36.174
V19288	United States Cold Storage Inc.	Milford	DE	-75.451	38.92
V19290	Working H Meats, LLC	Friendsville	MD	-79.392	39.639
V19296	Vertical Cold Storage, LLC	Marshville	NC	-80.393	34.984
V1930	Dairyland Produce, LLC	Mattapoisett	MA	-70.813	41.677
V19300	Skyline Provisions	Harvey	IL	-87.635	41.586
V19339	Vanee Foods Company	Broadview	IL	-87.861	41.854
V19387	Glenoaks Food, Inc.	Sun Valley	CA	-118.372	34.236
V19393	AMPC LLC.	Harlan	IA	-95.305	41.645
V19395	Sysco Houston, Inc.	Houston	TX	-95.422	29.937
V1940	Ruprecht Company	Mundelein	IL	-87.982	42.254
V19424	Tyson Sales and Distribution, Inc.	Rogers	AR	-94.124	36.319
V19435	Monogram Foods	Denison	IA	-95.364	42.009
V19444	Nor-Am Cold Storage, Inc	Saint Joseph	MO	-94.861	39.734
V19451A	Apex Cold Storage Co.	Fife	WA	-122.382	47.238
V19458	Americold Logistics, LLC	Sumter	SC	-80.386	33.868
V19461	Springfield Underground Inc DBA Cold Zone	Springfield	MO	-93.217	37.237
V19464	Americold	Douglas	GA	-82.854	31.533
V19470	Americold Logistics	Goldsboro	NC	-77.925	35.375
V19472A	Philly's Best Steak Co., Inc.	Yeadon	PA	-75.262	39.937
V19476	A.N. Deringer, Inc.	Sweetgrass	MT	-111.968	48.997
V19489	Americold Logistics, Inc.	Columbia	SC	-80.987	33.96
V19494	NOCS South Atlantic Cold Storage and Warehouse, LLC	North Charleston	SC	-79.98	32.902
V19518	Prism Team Services	Stockton	CA	-121.266	37.915
V19539	Mclane Foodservice Distribution, Inc.	Sumner	WA	-122.25	47.218
V19555	US Import Meat Inspection	Sweetgrass	MT	-111.969	48.995
V19564	Americold Logistics, LLC	Fairfield	OH	-84.506	39.328
V19566	Alex's Meat & Provisions	Brooklyn	NY	-74.022	40.647
V19584	Lineage Logistics, LLC	Albany	GA	-84.115	31.561
V19586	We Pack Logistics	Paris	TX	-95.573	33.638
V19596A	Christian Aid Ministries	Ephrata	PA	-76.106	40.142
V19603	Nebraska Cold Storage	Hastings	NE	-98.375	40.622
V19617	Pederson's Natural Farms, INC.	Hamilton	TX	-98.131	31.691
V19621	United States Cold Storage	Fort Worth	TX	-97.318	32.818
V19642	DHL Supply Chain	Osceola	IA	-93.785	41.022
V19687	Dreisbach Enterprises	Richmond	CA	-122.339	37.915
V19688	Sanderson Farms, Inc.	Bryan	TX	-96.416	30.649
V19690	Atlantic Coast Freezers, LLC	Vineland	NJ	-75.025	39.518
V19692A	AdvancePierre Foods Inc.	Enid	OK	-97.876	36.401
V19697	Chaudhry Meat Company, Inc.	Siler City	NC	-79.499	35.74
V19710	Golden Phoenix International Foods., Inc.	St. Louis	MO	-90.198	38.613
V19713	Arkansas Refrigerated Services	Fort Smith	AR	-94.427	35.393
V19716	Hampton Meat	Decatur	TN	-84.806	35.486
V19717	Lynch BBQ Company	Decorah	IA	-91.737	43.297
V1972	Calumet Diversified Meats Inc.	Pleasant Prairie	WI	-87.903	42.509
V19723	Americold Logistics LLC	Sanford	NC	-79.214	35.518
V19742	Lineage Logistics, LLC	Woodland	WA	-122.755	45.914
V19747	Pak Quality Foods, L.P.	San Angelo	TX	-100.43	31.471
V19753	Wenzel's Farm, LLC	Marshfield	WI	-90.175	44.64
V19758	AmeriCold Logistics	Amarillo	TX	-101.717	35.196
V19759	Lineage Logistics, LLC	Omaha	NE	-96.119	41.203
V19765	Texas Chaw	Caldwell	TX	-96.715	30.529
V1979	SLC Cold Storage	Commerce	CA	-118.132	34.006
V19790	Lineage Logistics, LLC	Norfolk	VA	-76.329	36.93
V1980	AdvancePierre Foods, Inc.	Amherst	OH	-82.199	41.416
V19833	Koch Foods of Mississippi LLC	Morton	MS	-89.663	32.314
V19840	Lineage Logistics, LLC	McDonough	GA	-84.142	33.401
V19857	Envision Cold	San Francisco	CA	-122.393	37.724
V1986	ANKERPAK	COLUMBUS	GA	-84.935	32.435
V19865	House of Raeford Farms of LA	Arcadia	LA	-92.942	32.559
V19869	United States Cold Storage	Smyrna	TN	-86.531	36.003
V19870	United States Cold Storage Inc	Warsaw	NC	-78.111	35.016
V19872	Empirical Foods, Inc.	So. Sioux City	NE	-96.418	42.431
V19874	Serv Cold  Acquisitions	Troy	AL	-85.96	31.822
V19879	Golden Valley Industries	Modesto	CA	-121.023	37.648
V19881A	Bylada Foods LLC	Camden	NJ	-75.12	39.925
V19884	Rosie's Snacks, Inc.	Swanton	VT	-73.092	44.886
V199	Hormel Foods Corporation	Austin	MN	-92.967	43.677
V19911	Lineage Logistics Services LLC	Allentown	PA	-75.6	40.567
V19915	Corfini Meat and Seafood	Salt Lake City	UT	-111.999	40.733
V19916	Salt Lake Fine Foods	Salt Lake City	UT	-111.891	40.713
V19934	Lineage Logistics, LLC	Statesville	NC	-80.962	35.816
V19941	Reichel Foods, Inc.	Rochester	MN	-92.466	43.968
V19941W	Reichel Foods Inc.	Rochester	MN	-92.51	44.088
V19957	United States Cold Storage	Minooka	IL	-88.278	41.451
V1996	Freedom Sausage, Inc.	Earlville	IL	-88.847	41.537
V19964	Shepherd Foods	Springville	UT	-111.651	40.177
V19976	McLane Foodservice	Aberdeen	MD	-76.196	39.491
V1999	SFC Global Supply Chain, Inc.	Salina	KS	-97.632	38.784
V19992	Wakefern Food Corp.	Keasbey	NJ	-74.328	40.51
V19996	Americold Corporation	Murfreesboro	TN	-86.392	35.801
V1999A	Schwan's Global Supply Chain, Inc.	Marshall	MN	-95.793	44.469
V199D	Research & Development, Hormel Foods Corporate Services, LLC	Austin	MN	-92.972	43.675
V199P	Progressive Processing, LLC	Dubuque	IA	-90.767	42.488
V199V	Hormel Foods Corporation	Knoxville	IA	-93.061	41.318
V2	ConAgra Brands, Inc.	Fort Madison	IA	-91.437	40.576
V2000	Hahn Bros. Inc.	Westminister	MD	-76.979	39.585
V20034	Holiday Meats of New Jersey, Inc.	Little Silver	NJ	-74.045	40.329
V20035	Bumble Bee Foods LLC	Cape May	NJ	-74.878	38.957
V2006	Manea's Meats Company	Sauk Rapids	MN	-94.166	45.591
V20088	Brakebush Irving, Inc.	Irving	TX	-96.913	32.823
V20124	W.T. Distributors, Inc.	Calexico	CA	-115.506	32.695
V2013	Vernon Central Logistics	Vernon	CA	-118.204	34.003
V20131	S & E Gourmet Cuts Inc.	San Bernardino	CA	-117.263	34.075
V20172	American Butchers, LLC	Beaver City	NE	-99.829	40.136
V2019	Anderson & Son Meat Processing LLC	Abingdon	VA	-81.966	36.759
V20190	Interstate Warehousing	Newport News	VA	-76.59	37.178
V20192	Northwoods Custom Meats, Inc.	Remer	MN	-93.916	47.056
V202	Pel-Freez, LLC	Rogers	AR	-94.115	36.337
V20204	Denmark Sausage LLC	Peoria	AZ	-112.225	33.564
V2023	Bellingar Packing	Ashley	MI	-84.572	43.136
V20230	Lineage Logistics LLC	Ottumwa	IA	-92.392	41.005
V20239	Northwood Foods, LLC	Northwood	IA	-93.22	43.457
V20247	Rocky Mountain Natural Meats	Henderson	CO	-104.883	39.873
V20263	Halal Farms U.S.A. Inc.	Shannon	IL	-89.74	42.157
V2029	Trim-Rite Food Corporation	Carpentersville	IL	-88.295	42.123
V20290	Targhee Brands, Inc.	Rexburg	ID	-111.766	43.71
V20321	Luce's Maine Grown Meats	North Anson	ME	-69.927	44.874
V20326	Coastal Pacific Food Distributors	Stockton	CA	-121.259	37.899
V20341	Nueske's Meat Products, Inc.	Wittenberg	WI	-89.17	44.828
V20343	Guymon Cold Storage	Guymon	OK	-101.449	36.718
V20358	Lineage Logistics SCS, LLC	Baton Rouge	LA	-91.117	30.47
V20373	Americold Logistics	Sebree	KY	-87.527	37.627
V20374	Quality Refrigerated Services	Omaha	NE	-95.963	41.219
V20411	Woodland Bison, Inc.	Memphis	IN	-85.746	38.455
V20446	Central Illinois Poultry Processing LLC	Arthur	IL	-88.472	39.736
V2048	Agile Cold Storage Macon, LLC	Macon	GA	-83.545	32.809
V20485	G&C Food Distributors, Inc.	Syracuse	NY	-76.277	43.107
V20520	Lineage Logistics, LLC	Lafayette	IN	-86.859	40.374
V20528	Springville Meat & Cold Storage Co. Inc.	Springville	UT	-111.613	40.163
V20552	SK Food Group	Reno	NV	-119.774	39.467
V20575	Rains Natural Meats	Gallatin	MO	-93.91	39.933
V20581	Atkins Sheep Ranch Inc.	Fremont	CA	-121.988	37.516
V2059	Korpack, Inc.	Bloomingdale	IL	-88.137	41.942
V206	Pilgrim's Pride Corporation	Nacogdoches	TX	-94.649	31.589
V20604	Gerber Poultry, LLC	Kidron	OH	-81.746	40.728
V2061	Arcadia Cold Hazleton, LLC	Hazle Township	PA	-76.053	40.945
V2063	Quality Meats and Seafood	West Fargo	ND	-96.902	46.884
V20645	RYZ, Inc.	El Paso	TX	-106.447	31.777
V20648	BiRite Foodservice Distributors	Brisbane	CA	-122.416	37.688
V2066	Quality Halal Processors	Harrisburg	PA	-76.882	40.283
V20663	Alto Valle Foods, Inc.	El Paso	TX	-106.434	31.775
V20670	Steve's Meat Market	De Soto	KS	-94.964	38.975
V20676	Supreme Meat Purveyors LLC	San Antonio	TX	-98.499	29.408
V20686	Local Meats dba Harris Country Meats	Greeneville	TN	-82.893	36.176
V20722	JBS Prepared Foods	Council Bluffs	IA	-95.885	41.243
V2073	C & F Packing Company	Lake Villa	IL	-88.07	42.41
V20737	Tyson Sales & Distribution, Inc.	Russellville	AR	-93.124	35.278
V20744	Summit Cold Storage, Inc.	Summit	IL	-87.812	41.792
V20748	Sig International, Iowa, Inc.	Boyden	IA	-96.006	43.191
V20758A	Truvant Foods NA LLC	Boscobel	WI	-90.687	43.144
V2076	Southern Deli Provisions LLC	Tampa	FL	-82.382	27.902
V20760A	Hazle Park Cold Storage Inc.	West Hazleton	PA	-75.999	40.964
V20788	Primal Custom Cutting LLC	South Amboy	NJ	-74.293	40.478
V20795	Koch Foods	Fairfield	OH	-84.486	39.334
V20795C	Koch Foods	Fairfield	OH	-84.489	39.337
V208	George's Processing, Inc.	Springdale	AR	-94.14	36.198
V20813	Sunrise Farms Inc.	Harris	IA	-95.443	43.352
V20816	Lineage Logistics, LLC	Gaston	SC	-81.027	33.842
V20826	Griggstown Quail Farm	Princeton	NJ	-74.602	40.444
V20835	Economy Cash & Carry, Inc.	El Paso	TX	-106.479	31.759
V20856	Eureka Locker, Inc.	Eureka	IL	-89.271	40.705
V2086	Southern Integrity LLC	Vinemont	AL	-86.969	34.25
V20860	Southern Meat Processing	Headland	AL	-85.344	31.325
V20865	M.G. Waldbaum Company	Gaylord	MN	-94.197	44.557
V2088	Sadler's Smokehouse, LLC	Henderson	TX	-94.826	32.163
V20886	Americold Logistics, LLC	Strasburg	VA	-78.351	39.011
V20891	Alaska Meat Packers Incorporated	Palmer	AK	-149.116	61.586
V20892	Delta Meat & Sausage Co.	Delta Junction	AK	-145.5	63.971
V20905	Capitol Cold Storage & Distribution	Salem	OR	-123.014	44.968
V2091	Brakebush Cold Storage	Grand Prarie	TX	-97.04	32.793
V20917	Behrmann Meat & Processing, Inc.	Albers	IL	-89.609	38.545
V20917A	Behrmann Meat and Processing #2	Albers	IL	-89.612	38.533
V20926	Buckhead Meat Northeast	Edison	NJ	-74.339	40.513
V2093	Vertical Cold Storage, LLC	Pendleton	IN	-85.766	39.999
V20935A	Michigan Turkey Producers Co-op, Inc.	Grand Rapids	MI	-85.695	42.941
V20944	Lineage Logistics, LLC	Fort Worth	TX	-97.349	32.831
V20950	B&G Foods, Inc.	Lebanon	TN	-86.406	36.131
V20954	Papa John Food Service	Gilbert	AZ	-111.834	33.362
V20958	Lee Kum Kee (USA) Foods Inc.	City of Industry	CA	-117.981	34.03
V20968	Nor-Am Cold Storage	Le Mars	IA	-96.188	42.768
V20968A	Nor-Am Logistics, Inc.	Schuyler	NE	-97.099	41.451
V2097	Vertical Cold Storage, LLC	Indianapolis	IN	-86.169	39.747
V20980	Food Services Inc.	Mount Vernon	WA	-122.36	48.422
V20982	Americold Logistics Inc	Atlanta	GA	-84.603	33.707
V20985	Texas Twist	Carrollton	TX	-96.877	32.955
V20989	AmeriCold Logistics	Fort Worth	TX	-97.356	32.833
V2099	Core X Premier	Burleson	TX	-97.275	32.477
V20995	Eugene Freezing & Storage	Eugene	OR	-123.141	44.056
V20AE	Lopez Foods, Inc.	Oklahoma City	OK	-97.683	35.472
V21006	Karlsburger Foods, Inc.	Monticello	MN	-93.824	45.304
V2104	Country Meats Inc.,	Arcadia	IA	-95.045	42.087
V21053	Cervantes Distributor, Inc.	Calexico	CA	-115.383	32.682
V21059	Americold Logistics, LLC	Chillicothe	MO	-93.537	39.778
V210A	Foster Poultry Farms, LLC	Turlock	CA	-120.847	37.487
V21108	Gary's Meat	Payson	UT	-111.724	40.026
V21125	Bryan's Meat Cutting, Inc.	Milan	PA	-76.642	41.862
V21134	Willamette Valley Meat Co.	Portland	OR	-122.657	45.525
V21159	Steak Master Inc.	Elwood	NE	-99.868	40.594
V2116	Millord River Impex Corporation	Hialeah	FL	-80.298	25.838
V21171	Cargill Meat Solutions	Fort Worth	TX	-97.293	32.767
V21177	Perdue Foods, LLC Replenishment Center	Prince George	VA	-77.311	37.197
V2118	Ruthven Meat Processing Inc.	Ruthven	IA	-94.897	43.131
V21183	New England Meat Packing, LLC	Stafford Springs	CT	-72.288	41.968
V21187	Shaffer Vension Farms, Inc.	Herndon	PA	-76.841	40.69
V21189	Performance Food Group	McKinney	TX	-96.608	33.215
V21196	Southern Hens, Inc.	Moselle	MS	-89.306	31.526
V21207	Lorentz Etc. Inc.	Cannon Falls	MN	-92.911	44.538
V2124	Shorr Packaging Corp.	West Chicago	IL	-88.258	41.88
V2126	Double-D Group	Greenville	KY	-87.219	37.225
V21263	Wayne Farms LLC	Decatur	AL	-87.048	34.611
V21265	Smucker's Meats	Mt. Joy	PA	-76.507	40.089
V21273	McAllen Cold Storage, Ltd.	McAllen	TX	-98.255	26.134
V21293	Bern Meat Plant	Bern	KS	-95.971	39.963
V21307	Broadleaf Inc.	Vernon	CA	-118.237	33.991
V2132	AdvancePierre Foods, Inc.	Cincinnati	OH	-84.463	39.308
V21328	Lineage Logistics LLC	Milwaukee	WI	-88.051	43.192
V21328A	Midwest Refrigerated Milwaukee, Inc.	Milwaukee	WI	-88.015	43.176
V2133	Cargill Meat Solutions	Albert Lea	MN	-93.356	43.626
V21332	Werling and Sons, Inc.	Burkettsville	OH	-84.644	40.348
V2134	GMS DBA Sun Commodities	Doral	FL	-80.32	25.805
V21352	Mcbride Meats Company, Inc.	South Pittsburg	TN	-85.663	35.008
V21371	Yants Snack Foods LLC	Jackson Center	OH	-84.041	40.445
V21377	Cargill Kitchen Solutions, Inc	Mason CIty	IA	-93.232	43.136
V2138	Atlantic Grocery Supply GBA Sun Commodities Inc.	Miami	FL	-80.254	25.884
V21391	Richmond Wholesale Meat, LLC	Richmond	CA	-122.341	37.914
V2140	U.S. Foods, Inc.	Chesterfield	MO	-90.605	38.664
V21407	Armada	East Point	GA	-84.505	33.651
V21415	PJ Food Service	Grand Prairie	TX	-97.053	32.8
V2142	Maersk Warehousing & Distribution Services USA, LLC	Wilmington	NC	-78.016	34.341
V2143	Compass Cold Storage, LLC	Mulberry	AR	-94.108	35.502
V2145	Penn Valley Meats, LLC	Millersburg	PA	-76.865	40.56
V2146	Creek Ranch Inc.	Boyd	TX	-97.584	33.029
V21465B	Water Lilies Food, LLC	Bayshore	NY	-73.263	40.766
V21467	United Source One, Inc.	Belcamp	MD	-76.23	39.476
V21469	The Lamb Cooperative, Inc.	Compton	CA	-118.221	33.85
V21480B	LandMark Snacks, LLC	Beatrice	NE	-96.744	40.281
V21483	Lineage Logistics, LLC	Unadilla	GA	-83.746	32.242
V21488	OWB Packers, LLC	Brawley	CA	-115.52	32.996
V21491	Frase Foods, Inc.	El Paso	TX	-106.448	31.775
V21504	Pacific Coast Container, Inc.	Carson	CA	-118.252	33.821
V21507	Americold Logistics	Salem	OR	-123.001	44.978
V21513	Tyson Fresh Meats, Inc.	Ottawa	IL	-88.825	41.378
V2152	Agile Cold Claymont LLC	Claymont	DE	-75.448	39.814
V21524	World Casing Corporation	Maspeth	NY	-73.921	40.717
V2156	Spruce Hill Meats	Bowman	ND	-103.432	46.182
V21572	Robert Winner Sons Inc.	Yorkshire	OH	-84.488	40.34
V21574	Allentown Refrigerated Terminals Inc.	Boyertown	PA	-75.659	40.357
V21577	Southside Market & Barbeque	Elgin	TX	-97.386	30.35
V21585	Kiowa Locker System, LLC	Kiowa	KS	-98.486	37.016
V21598	Americold Logistics, LLC	Lula	GA	-83.727	34.377
V2160	Pride of Iowa	Grinnell	IA	-92.747	41.745
V21602	Exel Inc.	Dayton	OH	-84.283	39.774
V21621	Americold Logistics LLC	Benson	NC	-78.515	35.414
V21654	Sysco International Food Group	Plant City	FL	-82.111	27.988
V21654A	Sysco International Food Group, Inc.	Jacksonville	FL	-81.715	30.366
V21666	Sunleaf Farms	Mesa	WA	-119.026	46.574
V21677	My Own Meals, Inc.	Chicago	IL	-87.759	41.867
V2168	Waseca Morgans Meat Market LLC	Waseca	MN	-93.509	44.089
V21693	PJ Food Service	Orlando	FL	-81.411	28.427
V21699	Molokai Livestock Cooperative	Ho'olehua	HI	-157.085	21.154
V21702	Sysco Foodservices of Hampton Roads, Inc.	Suffolk	VA	-76.434	36.889
V21713	Brooke Industries, Inc.	Fond Du Lac	WI	-88.492	43.79
V21725B	888 Food Company	Temple City	CA	-118.058	34.087
V21745	Orion Food Systems	Sioux Falls	SD	-96.765	43.575
V2175	RSF, Inc., DBA FreezPak Logistics	Philadelphia	PA	-75.107	39.991
V2175A	RSF Inc dba FreezPak Logistics	Philadelphia	PA	-75.107	39.991
V21780	Burt's Meat & Poultry	Eyota	MN	-92.229	43.988
V21789	Abanto Forwarding, Inc.	Hidalgo	TX	-98.253	26.113
V21793	Burris Logistics	Orlando	FL	-81.362	28.408
V218	Rudolph Foods Company, Inc.	Dallas	TX	-96.882	32.769
V21802A	Brother and Sister Food Services Inc.	Camp Hill	PA	-76.924	40.232
V21826	Peoria Packing, Ltd.	Chicago	IL	-87.738	41.866
V21837	Contessa Premium Foods	Vernon	CA	-118.208	33.988
V21848	Wayne Mays Meat Processing	Taylorsville	NC	-81.166	35.922
V21857	Lineage Logistics Services, LLC	Vernon	CA	-118.192	34.003
V21882	S&S Gilardi, Inc.	Mount Vernon	OH	-82.482	40.369
V21898	Farmers Union Industries, LLC	Estherville	IA	-94.811	43.393
V21899	Americold	Carson	CA	-118.243	33.808
V219	Mediterranean Fine Foods	New Bedford	MA	-70.922	41.622
V21930I	Fresh Mark Cold Storage	Massillon	OH	-81.492	40.786
V21934A	Lineage Logistics PFS, LLC	Wilmington	CA	-118.252	33.788
V21935	Suffolk Cold Storage	Suffolk	VA	-76.477	36.814
V21936	Sonstegard of Arkansas	Springdale	AR	-94.122	36.194
V2197	Major Products Co., Inc.	Little Ferry	NJ	-74.035	40.846
V22	Melrose Storage and Distribution, Inc.	Sayreville	NJ	-74.305	40.483
V22010	Pilgrim's Pride Distribution Center	Pittsburg	TX	-94.966	33.062
V22022	National Meat & Provisions, LLC	Reserve	LA	-90.566	30.064
V2204	Froods International Warehouse and Distribution LLC	Tucson	AZ	-110.951	32.209
V22043	American Laboratories, LLC	Omaha	NE	-95.965	41.207
V22052	Corfini Meat and Seafood	Chula Vista	CA	-117.058	32.593
V22073	Lineage Logistics PFS, LLC	Vernon	CA	-118.236	33.992
V22076	Buckhead Meat Midwest Inc	Hampshire	IL	-88.505	42.134
V22080	International Meat Co.	Chicago	IL	-87.803	41.923
V22095	Creston Valley Meats	Creston	CA	-120.455	35.461
V22102	Valley Fine Foods Company, Inc.	Benicia	CA	-122.128	38.071
V22104	Nital Trading Co Inc	Hialeah	FL	-80.372	25.927
V2213D	Buckhead Meat Dallas a Sysco Company	Dallas	TX	-96.889	32.685
V2216	Yoakum Packing Co.	Yoakum	TX	-97.15	29.289
V221A	Smithfield Fresh Meats Corp.	SMITHFIELD	VA	-76.63	36.995
V222	Smithfield Packaged Meats Corp.	Mason City	IA	-93.258	43.14
V2225	Blueridge processing Corp	Marion	NC	-81.952	35.651
V2234	Lineage Logistics, LLC	Houston	TX	-95.181	29.834
V226	Independent Meat Company	Twin Falls	ID	-114.443	42.533
V2260E	AdvancePierre Foods, Inc.	Enid	OK	-97.807	36.417
V2260Y	AdvancePierre Foods, Inc.	Enid	OK	-97.799	36.396
V2265	Well Luck Co	Atlanta	GA	-84.326	33.686
V226A	Independent Meat Co.	Twin Falls	ID	-114.419	42.542
V2274	Lone Star Meats Ltd.	Austin	TX	-97.725	30.214
V2283	3rd Party Solutions & Logistics	Hayward	CA	-122.077	37.619
V2288	Tyson Sales and Distribution, Inc	Indianapolis	IN	-86.12	39.75
V2292	Ouray Meat and Cheese Market	Ouray	CO	-107.672	38.025
V2297	Exel Inc. dba DHL Supply Chain (USA)	Salt Lake City	UT	-112.0	40.734
V2312	E.A. Sween Company	Hodges	SC	-82.222	34.324
V2318	Louisa Food Products, Inc.	St Louis	MO	-90.254	38.717
V2326	Benjamin R. Lapin	Bradenton	FL	-82.31	27.424
V2329	Harrison Harvesting And Processing LLC	Carlisle	KY	-84.124	38.324
V233	Conagra Brands (Conagra Foods Packaged Foods, LLC)	Russellville	AR	-93.095	35.276
V2336	Swine & Bovine Processing, LLC	Wray	CO	-102.224	40.095
V2339	Three Rivers Trucking Inc.	Long Beach	CA	-118.222	33.802
V2345	RG Exports LLC	Mission	TX	-98.315	26.189
V2349	Jake's Finer Foods	Houston	TX	-95.51	29.93
V2366	Ben-Lee Processing Inc.	Atwood	KS	-101.046	39.831
V2377	Johnsons Sausage Shoppe	Rio	WI	-89.246	43.445
V2378	Stevison Ham Company	Portland	TN	-86.528	36.591
V2379	Backroad Meats Inc.	Milaca	MN	-93.641	45.789
V2405	Link Snacks Inc	Mankato	MN	-93.993	44.184
V2406	A&I Logistic Inc.	South Gate	CA	-118.172	33.933
V2411	Fortune Wisconsin	Deforest	WI	-89.329	43.258
V242	Schiltz Foods, Inc.	Sisseton	SD	-97.051	45.665
V2432	Customized Distribution, LLC	Atlanta	GA	-84.547	33.742
V2437	Benson + Turner Foods, Inc.	Waubun	MN	-95.933	47.189
V2438	Sugar Creek Meat Processing LLC	Oldfort	TN	-84.801	34.99
V2439	Old Salt Meat Company DBA Ranchland Packing	Butte	MT	-112.552	45.997
V244	Tyson Fresh Meats, Inc.	Storm Lake	IA	-95.188	42.64
V244A	Plainville Farms	New Oxford	PA	-77.057	39.859
V244D	Farm Fresh Turkey Products	New Oxford	PA	-77.069	39.864
V244G	Tyson Fresh Meats, Inc.	Goodlettsville	TN	-86.711	36.331
V244L	Tyson Fresh Meats, Inc.	Columbus Junction	IA	-91.356	41.295
V2451	E.A. Sween Company	Eden Prairie	MN	-93.481	44.861
V2452	Film Logic Distribution LLC	Rancho Dominguez	CA	-118.263	33.896
V245C	Tyson Fresh Meats, Inc.	Dakota City	NE	-96.416	42.423
V2461	Nestle USA, Inc.	Medford	WI	-90.341	45.123
V2478	Fortune Wisconsin LLC	Windsor	WI	-89.335	43.2
V2482	P3 Custom Meats LLC	Dunlap	TN	-85.288	35.507
V248A	Tony Downs Foods	Madelia	MN	-94.419	44.046
V2495	American Heritage Beef Company LLC	Nowata	OK	-95.683	36.728
V2497	Central Storage & Warhouse	Franksville	WI	-87.941	42.785
V2503	Muleshoe Meat Processing	Muleshoe	TX	-102.725	34.223
V2504	OSI Industries, LLC	Chicago	IL	-87.653	41.811
V2506	Caravan , Inc	Elizabeth	NJ	-74.195	40.666
V2508	The Bruss Company	Chicago	IL	-87.738	41.946
V2509	Pioneer Wholesale Meat	Chicago	IL	-87.685	41.885
V2510	Best Choice Meats	Alsip	IL	-87.717	41.663
V2519	Newcold	McDonough	GA	-84.141	33.396
V2534	Great Western Beef Company	Chicago	IL	-87.646	41.82
V2539D	ODW Logistics, Inc.	Romeoville	IL	-88.109	41.612
V2546	Banks Cold Storage, Inc.	Commerce	GA	-83.399	34.298
V2550	DSV Solutions, LLC	Folcroft	PA	-75.272	39.892
V2555	Florida Freezer Limited Partnership	North Fort Myers	FL	-81.829	26.72
V2556	Florida Freezer Limited Partnership	Miami	FL	-80.19	25.948
V2557	Almena Meat Company, Incorporated	Almena	WI	-92.039	45.41
V2557C	Almena Meat Company, Incorporated	Cumberland	WI	-92.011	45.483
V2576	Pepe's Operating, LLC	Chicago	IL	-87.66	41.861
V2590	Cypress Cold Storage, LLC	Springdale	AR	-94.114	36.197
V2591	Branding Iron Holdings - Holten Meat	Sauget	IL	-90.149	38.578
V2592	Byron Center Wholesale Meats, Inc.	Byron Center	MI	-85.725	42.813
V2593	Vertical Cold Storage LLC	Burleson	TX	-97.279	32.476
V2600	Rode's Meats, LLC	Delphos	OH	-84.318	40.853
V2603	Quail International Inc.	Greensboro	GA	-83.152	33.571
V2605	Gateway Refrigerated Warehouse LLC	Warrenton	MO	-91.112	38.747
V2607	Armada Warehouse Solutions, LLC	Flower Mound	TX	-97.03	32.991
V2612	J. W. TREUTH & SONS, INC.	Catonsville	MD	-76.776	39.272
V2622	MRE STAR, LLC.	Sarasota	FL	-82.536	27.427
V2627	White Transfer & Storage Company	Fort Dodge	IA	-94.236	42.47
V2629	Hobson Foods Service	Nashville	TN	-86.893	36.18
V263	Jones Dairy Farm	Fort Atkinson	WI	-88.846	42.92
V2633	Vista Packaging and Logistics	Columbus	OH	-83.129	39.975
V2636	INCO Group Inc.	Pharr	TX	-98.202	26.108
V263A	Jones Dairy Farm	Fort Atkinson	WI	-88.85	42.916
V2665	Profile Food Ingredients	Elgin	IL	-88.307	42.057
V2671	United Foods International (USA) Inc.	Phoenix	AZ	-112.203	33.441
V2693	Callahan Meats, Inc.	Barnesville	MN	-96.534	46.659
V2695	Corex Performance	Salt Lake City	UT	-111.966	40.737
V2697	Buckhead Beef	College park	GA	-84.46	33.633
V27	Tyson Foods, Inc.	Grannis	AR	-94.335	34.241
V2710	Jireh Enterprises LLC	Neosho	MO	-94.416	36.932
V2711	Pride Enterprise - Food Division	Raiford	FL	-82.193	30.066
V2715	At Last Gourmet Foods	Minneapolis	MN	-93.241	44.958
V2717	Atlanta Community Food Bank	East Point	GA	-84.495	33.663
V2721	Lineage Logistics, LLC	Hobart	IN	-87.308	41.498
V2722	Crowley Logistics	Jacksonville	FL	-81.694	30.363
V27221	Standard Meat Company	Dallas	TX	-96.913	32.696
V27236	Sunnyside Meats, Inc.	Durango	CO	-107.881	37.111
V27237	Gore's Processing, Inc.	Edinburg	VA	-78.62	38.803
V27240	Old Hickory Smokehouse	Lewisburg	TN	-86.866	35.453
V27254	Oversea Dewied International LLC	San Antonio	TX	-98.393	29.434
V27257	Central KY Custom Meats, Inc.	Liberty	KY	-85.061	37.372
V27261	The Hillshire Brands Company	Rochelle	IL	-89.04	41.907
V27268	Maui Cattle Company, LLC	Kahului	HI	-156.474	20.887
V27268A	Maui Cattle Company, LLC	Puunene	HI	-156.453	20.853
V2727	Home Market Foods, Inc.	Norwood	MA	-71.19	42.169
V27280	We Pack - North Carolina	Maxton	NC	-79.372	34.795
V2729	Mexus Cold Storage	Laredo	TX	-99.48	27.684
V27290A	United States Cold Storage LLc	Quakertown	PA	-75.425	40.44
V2730	CJ Logistics America, LLC	Lula	GA	-83.717	34.378
V27316	Good Food Concepts, LLC	Colorado Springs	CO	-104.742	38.838
V2732	The Cut Meat Market	Sanborn	IA	-95.64	43.184
V27324	AmeriCold Logistics, LLC	Massillon	OH	-81.542	40.779
V27342A	Melotte Distributing, Inc.	Denmark	WI	-87.81	44.352
V27384	Smithfield Packaged Meats Corp.	Sioux Center	IA	-96.171	43.093
V27389	Pitman Farms	Sanger	CA	-119.552	36.693
V27393	Nuniwarmiut Reindeer & Seafood Products	Mekoryuk	AK	-166.185	60.389
V27398	Berkshire Refrigerated Warehousing LLC	Chicago	IL	-87.659	41.811
V27406	Oxford Trading	Taunton	MA	-71.137	41.952
V27435	The Cut Custom Processing, LLC	Rosebush	MI	-84.773	43.684
V27446	Ajinomoto Health & Nutrition North America	Akron	OH	-81.488	41.096
V27446A	Ajinomoto Health & Nutrition North America	Akron	OH	-81.416	41.059
V27453	New Orleans Cold Storage & Warehouse Company, Ltd.	New Orleans	LA	-90.016	29.997
V27462	BRK Meats, LLC	Carthage	TX	-94.36	32.159
V27467	A.J.'s Lena Maid Meats, Inc.	Lena	IL	-89.829	42.381
V27486A	Curly's Custom Meats	Jackson Center	OH	-84.049	40.44
V27488	Mekong Fresh Meats, Inc.	Mosinee	WI	-89.668	44.743
V27493	Central Oregon Butcher Boys	Prineville	OR	-120.867	44.324
V2764	Corsentino Meat Processing, LLC	Walsenburg	CO	-104.718	37.656
V2768	Cold-Link Logistics, Hattiesburg, MS	Ellisville	MS	-89.211	31.602
V276A	AdvancePierre Foods, Inc	Portland	ME	-70.304	43.707
V2771	Doña Tina	Irvine	CA	-117.847	33.681
V2774	Siebert Premium Meats	Colby	KS	-101.054	39.467
V278	Tyson Fresh Meats, Inc.	Holcomb	KS	-101.024	38.0
V2782	Odenthal Meats Inc.	New Prague	MN	-93.628	44.486
V2783	FreezPak Logistics	Baytown	TX	-94.865	29.73
V2788	Brocks Butcher Block	Sparta	WI	-90.841	44.108
V279A	LSI, Inc.	Alpena	SD	-98.37	44.187
V28	Smithfield Packaged Meats Corp.	Cudahy	WI	-87.864	42.954
V2801	PNW Veg Co LLC	Salem	OR	-122.957	45.055
V2803	Golden California Meat Packer Inc.	Fresno	CA	-119.848	36.786
V2805	Cold 18	Aventura	FL	-80.149	25.94
V2813	IF Co-Pack, LLC DBA Initiative Foods LLC	Sanger	CA	-119.549	36.69
V2813A	IF Co-Pack, LLC DBA Initiative Foods	Sanger	CA	-119.549	36.69
V2815	Whitleyville Station Meat Processing	Whitleyville	TN	-85.672	36.446
V2824	Overhill Farms, Inc.	Vernon	CA	-118.214	34.004
V2825	Blue Mountain Meats, Inc.	Monticello	UT	-109.339	37.868
V2829	Good Chaan	SANTA CLARA	CA	-121.982	37.372
V2834	NO BULL Prime Meats Production Facility	Albuquerque	NM	-106.59	35.145
V2846A	Far West Meats	San Bernadino	CA	-117.256	34.121
V2847	Revival Gourmet Foods, LLC	Downingtown	PA	-75.693	40.005
V2857	Agile Cold Storage Joliet LLC	Joliet	IL	-88.031	41.496
V2858	United States Cold Storage, Inc.	Lebanon	IN	-86.494	40.031
V2862B	Oberto Snacks Inc.	Kent	WA	-122.283	47.388
V2862C	Oberto Snacks Inc.	Kent	WA	-122.268	47.4
V2872	Newport Meat Northern California, Inc.	Fremont	CA	-121.916	37.465
V2879	Pearson Foods Corporation	Grand Rapids	MI	-85.64	42.907
V287A	Gaspar's Sausage Co., Inc.	N. Dartmouth	MA	-70.992	41.665
V2891	Dolores Canning Co., Inc.	Los Angeles	CA	-118.176	34.049
V2895	Lineage Logistics, LLC	Lyndhurst	VA	-78.94	38.031
V2899	Americold Logistics	Dallas	TX	-96.674	32.789
V2906	IB Industries Inc. d/b/a IBI Data	Brownsdale	MN	-92.871	43.749
V2908	Quick Pick Express	Oakland	CA	-122.308	37.816
V2919	CPS Logistics LLC	Woodstown	NJ	-75.323	39.659
V2921	GDC Cold, Inc.	Laredo	TX	-99.473	27.683
V2926	Pork King Packing, Inc.	Marengo	IL	-88.617	42.201
V2926M	Pork King Packing, Inc.	Marengo	IL	-88.617	42.202
V2929	Western Smokehouse	Greentop	MO	-92.564	40.354
V2933	Syracuse Food Group, LLC	Ponder	TX	-97.288	33.188
V2938	Woods Smoked Meats, Inc.	Bowling Green	MO	-91.21	39.348
V2949	Frick's Quality Meats	Washington	MO	-91.055	38.571
V295	McLane Foodservice	Arlington	TX	-97.077	32.681
V2952	Americold Logistics	Syracuse	NY	-76.267	43.118
V2958	El Rey Meat Company	St. Louis	MO	-90.226	38.698
V2962	Mrs. Gerry's Kitchen	Albert Lea	MN	-93.348	43.675
V2965	FlexXray LLC	Las Vegas	NV	-115.033	36.267
V2966	National Beef Packing Food Service	Kansas City	KS	-94.617	39.085
V2969	Swiss Processing Plant Inc.	Hermann	MO	-91.47	38.562
V2970	Trend Leasing South	Pennsauken	NJ	-75.045	39.988
V2975	Meadville Locker LLC	Chillcothe	MO	-93.55	39.787
V2977	Lineage Logistics, LLC	Waddell	AZ	-112.386	33.57
V2982	Lineage Logistics Services, LLC	Port Wentworth	GA	-81.195	32.184
V2987	Arcadia Cold Phoenix, LLC	EL Mirage	AZ	-112.327	33.603
V2988	Americold LLC	Kansas City	MO	-94.55	38.855
V2995	Matador Butcher Shop, LLC	Palmyra	MO	-91.518	39.802
V2997	Richmond Wholesale	Sandston	VA	-77.343	37.508
V2998	Jordan Casing Company	San Rafael	CA	-122.502	37.958
V2A	Sorbello Warehouse Services , LLC	Woodstown	NJ	-75.322	39.657
V2FR	ConAgra Product Development Lab	Omaha	NE	-95.926	41.255
V3	Smithfield Packaged Meats Corp.	St Charles	IL	-88.275	41.916
V3002	Arcadia Cold Jacksonville, LLC	Jacksonville	FL	-81.65	30.415
V301	Yosemite Valley Beef Packing Co., Inc.	Merced	CA	-120.471	37.186
V3028	Purchase Order of Miami Inc.	Miami	FL	-80.259	25.839
V3037	ACL America, Inc.	City of Industry	CA	-117.985	34.023
V3039	Van Hessen USA, Inc.	Chicago	IL	-87.673	41.813
V304A	Fred Usinger, Inc.	Milwaukee	WI	-87.908	43.026
V3050	KettleWorks, LLC	Neffsville	PA	-76.241	40.056
V3053	D'Allende Foods & Cold Storage LLC	El Paso	TX	-106.464	31.774
V3056	Americold Logistics, LLC	Wallula	WA	-118.918	46.14
V3057	DeTraglia Farms, LLC	Mechanicsburg	PA	-76.913	40.163
V3058	Core X Gress	Scranton	PA	-75.693	41.43
V3058A	Core X Gress	Scranton	PA	-75.682	41.435
V3058C	Core X Gress	Scranton	PA	-75.675	41.441
V3061	Lineage Logistics LLC	San Antonio	TX	-98.415	29.443
V3072	Winchester Cold Storage	Winchester	VA	-78.149	39.199
V3076	Kingdom Farms	Chicago	IL	-87.685	41.885
V309	Garden Fresh Beef Jerky, Inc.	Garden Grove	CA	-117.946	33.774
V310	MEDLOG Cold Storage Savannah LLC	Rincon	GA	-81.232	32.292
V3101	Del Campo Distribution	Fresno	CA	-119.851	36.792
V3103B	Sub-Zero Storage, LLC	Eunice	LA	-92.333	30.504
V3107	SafeScan Logistics, LLC	Flowery Branch	GA	-83.887	34.215
V3110	Ray S. F., Inc DBA, FreezPak Logistics	Los Angeles	CA	-118.215	34.016
V3116B	United States Cold Storage, Inc.	Harrisonburg	VA	-78.897	38.396
V3122	Quirch Foods LLC	Katy	TX	-95.785	29.792
V3125	Ray S.F., Inc., DBA, FreezPak Logistics	Jacksonville	FL	-81.634	30.4
V3131	Swift Pork Company	Worthington	MN	-95.564	43.632
V3133A	Georgia Cold Storage	Columbus	GA	-84.946	32.453
V31350	Shinsegae Foods, Inc.	Salem	OR	-123.004	44.989
V31351	AmeriCold Logistics	Cedar Rapids	IA	-91.636	41.93
V31354	Grand Prairie Foods, Inc.	Sioux Falls	SD	-96.691	43.563
V31354N	Grand Prairie Foods, Inc.	Sioux Falls	SD	-96.749	43.567
V3136	Americold Logistics LLC	Fairmont	MN	-94.439	43.66
V3141	G&C Foods Distributor & Brokers	Alachua	FL	-82.495	29.815
V3149	Lineage Logistics LLC	Des Moines	IA	-93.593	41.634
V31532	Tonali's Meats, LLC	Denver	CO	-104.931	39.771
V31534	Cedar Valley Services, Inc.	Albert Lea	MN	-93.354	43.622
V3154	Americold Logistics	Fort Dodge	IA	-94.137	42.498
V31540	Hickman's Egg Ranch, Inc.	Arlington	AZ	-112.749	33.365
V31542	Texas Egg Products LLC	Waelder	TX	-97.28	29.691
V31546	New Day Farms, LLC	Raymond	OH	-83.453	40.394
V31552	Smithfield Distribution, LLC	Crete	NE	-96.958	40.624
V31561	Maple Ridge Meats LLC	Benson	VT	-73.312	43.676
V3157	Des Moines Cold Storage, Inc.	Des Moines	IA	-93.595	41.647
V3158	Vertical Cold Storage, LLC	Kansas City	MO	-94.541	39.036
V3160	CPS Logistics LLC	Woodstown	NJ	-75.322	39.661
V31615	Lineage Logistics, LLC	Altoona	IA	-93.47	41.658
V31640	Konoike - E Street, Inc.	Wilmington	CA	-118.251	33.777
V31647	Theurers Custom Meat Inc	Lewiston	UT	-111.878	41.976
V31663	US Foods, Inc.	Lexington	NC	-80.326	35.777
V31679	South Florida Foods International, Inc.	Miami	FL	-80.356	25.828
V31681	Ankeny Cold Storage, LLC	Ankeny	IA	-93.594	41.716
V31690	Quality Refrigerated Services, Inc.	Spencer	IA	-95.149	43.16
V3170	Lineage Logistics, LLC DBA Hanson Cold Storage Co.	Logansport	IN	-86.395	40.733
V31718	McLane Foodservice	Orlando	FL	-81.352	28.411
V31719	Orlando Provisions, LLC	Orlando	FL	-81.441	28.453
V3172	Nor-Am Cold Storage	Reedsburg	WI	-89.989	43.518
V31720	Blue Line Distributing	Orlando	FL	-81.394	28.416
V31724	McLane Foodservice	Burlington	NJ	-74.848	40.039
V31727	Cypress Cold Storage	Maumelle	AR	-92.39	34.862
V31727A	Kiryas Joel Poultry Processing Plant	Monroe	NY	-74.159	41.336
V31740	Americold Logistics LLC	Lakeville	MN	-93.22	44.635
V31750A	Nuovo Pasta Productions, Ltd.	Stratford	CT	-73.155	41.169
V31757	Buckhead Meat of Denver	Aurora	CO	-104.798	39.761
V31767	Lineage Logistics PFS, LLC	Chicago	IL	-87.677	41.846
V31771	FlexXray, LLC	Arlington	TX	-97.079	32.683
V31771A	FlexXray, LLC	Aurora	IL	-88.384	41.794
V31774	MBM Corporation	Orlando	FL	-81.414	28.459
V31776	Eickman's Processing Co., Inc.	Seward	IL	-89.357	42.235
V31777	Burgundy Pasture Meats LLC	Grandview	TX	-97.186	32.276
V31793	Lineage Logistics LLC	Mount Pleasant	IA	-91.522	40.972
V31820	His Meat Company, LLC	Rudolph	WI	-89.806	44.496
V31820A	His Meat Company	Rudolph	WI	-89.804	44.496
V31829	Lineage Logistics HCS, LLC	Scranton	PA	-75.672	41.399
V31865	Paradise Locker Meats	Trimble	MO	-94.568	39.475
V31866M	Woodson County Prime Meats Pro	Yates Center	KS	-95.741	37.882
V31878	Advertising Resources, Inc	Alsip	IL	-87.757	41.68
V31881	DG Foods, LLC	Hazlehurst	MS	-90.401	31.924
V31884	Pritzlaff Wholesale Meats, LLC	New Berlin	WI	-88.125	42.997
V31890	ConAgra Foods Packaged Foods, LLC	Rancho Cucamonga	CA	-117.553	34.088
V31896	Universal Pure, LLC	Malvern	PA	-75.557	40.067
V31896AR	Universal Pure Holdings, LLC	Arlington	TX	-97.068	32.746
V31896D	Universal Pure, LLC	Delphos	OH	-84.319	40.855
V31898	Kensington Lockers Inc.	Kensington	KS	-99.034	39.771
V3190	Americold Logistics LLC	Fremont	NE	-96.489	41.421
V3191	Vertical Cold Storage, LLC	La Vista	NE	-96.079	41.184
V31910	Bella Bella Gourmet Foods, LLC	West Haven	CT	-72.982	41.29
V3195	Sunbow Distributing	Orem	UT	-111.683	40.269
V3196	3200 Clinton St., LLC	West Seneca	NY	-78.763	42.86
V31965	Triumph Foods LLC	St Joseph	MO	-94.876	39.719
V31988	Strassburger Meats, LLC	Carlstadt	NJ	-74.079	40.833
V31996	Kaiser Foodline LLC	Garland	TX	-96.687	32.896
V320	Smithfield Fresh Meats Corp.	Milan	MO	-93.118	40.22
V32006	Frozen Assets Cold Storage LLC	Chicago	IL	-87.683	41.844
V32006A	Frozen Assets Cold Storage	Northlake	IL	-87.917	41.919
V32006C	Frozen Assets Cold Storage LLC	Chicago	IL	-87.732	41.815
V32027	Monogram Prepared Meats, LLC	Harlan	IA	-95.333	41.626
V32029	Kiolbassa Provision Company Inc.	San Antonio	TX	-98.516	29.413
V32029A	Kiolbassa Provision Company	San Antonio	TX	-98.511	29.41
V32042	Brushy Prairie Packing, Inc.	LaGrange	IN	-85.268	41.647
V32053	Fresh Grill LLC	Santa Ana	CA	-117.865	33.708
V32062	Washington County Meat Packing	Bristol	VA	-82.213	36.65
V32064	LA PASTA INC	Silver Spring	MD	-77.058	39.002
V32080	Van Buren Cold Storage, LLC	Van Buren	AR	-94.337	35.427
V32087	Americold Logistics	Atlanta	GA	-84.601	33.714
V3211	National Distribution Centers	Rincon	GA	-81.201	32.258
V3212	Cuttinup Custom Meat Processing, LLC	Leeton	MO	-93.707	38.62
V3213	GMR Freezer & Cold Storage	Vineland	NJ	-75.057	39.504
V32130	Dakota Provisions LLC	Huron	SD	-98.159	44.367
V32145	Emmaus Foods, LLC	Albertville	AL	-86.216	34.283
V3215	Americold Logistics, LLC	Napoleon	OH	-84.1	41.412
V32153	Opportunities, Inc. of Jefferson County	Fort Atkinson	WI	-88.832	42.939
V32153A	Opportunities, Inc.	Oconomowoc	WI	-88.478	43.075
V32158	The Royal Butcher	Braintree	VT	-72.689	43.932
V3216	Americold Logistics	Garden City	KS	-100.894	37.99
V32161	Guymon Extracts, Inc	Guymon	OK	-101.451	36.711
V32166	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Itasca	IL	-88.047	41.989
V32187	Quality Distributors	Harmon	GU	144.72	13.473
V32188	Luen Fung Enterprises	Harmon	GU	144.813	13.504
V3219	Colorado Premium Cold Storage	Denver	CO	-104.966	39.79
V322	Double J Meat Packing, Inc.	Pierce	CO	-104.763	40.635
V3220	MDV/Spartannash, LLC	Norfolk	VA	-76.235	36.86
V3220A	MDV/Spartannash, LLC	Norfolk	VA	-76.239	36.857
V3224	Savello USA, Inc.	Hanover Township	PA	-75.932	41.227
V3228	Nor-Am Cold Storage	Owen	WI	-90.563	44.956
V3229	Tyson Fresh Meats, Inc.	Emporia	KS	-96.216	38.403
V3230	Sargento Cheese	Hilbert	WI	-88.163	44.133
V3245	Americold Logistics LLC	Marshall	MO	-93.244	39.118
V3247	Great Lakes Cold Storage	Cranberry Township	PA	-80.116	40.708
V32511	Harvester Meat Co.	Canton	IL	-90.028	40.597
V3254	Cedar Valley Services	Austin	MN	-92.98	43.689
V3263	Core X Chicagoland Regional LLC (Crown Point)	Crown Point	IN	-87.319	41.379
V3265	Heritage Meats, Inc.	Leoti	KS	-101.354	38.482
V3271	Americold Logistics	Vineland	NJ	-75.061	39.489
V3282	SK Food Group, Inc.	McDonald	TN	-84.967	35.139
V3283	Seaonus Cold Storage - Jacksonville LLC	Jacksonville	FL	-81.709	30.346
V3286	MOWI USA LLC	Arlington	TX	-97.049	32.763
V3288	International Cruise Food & Hotel Suppliers, Inc.	Hialeah	FL	-80.369	25.926
V3296	Vima Development, LLC	Laredo	TX	-99.514	27.545
V33	Performance Food Group	Taunton	MA	-71.137	41.944
V3308	Lineage Logistics, LLC	Louisville	KY	-85.772	38.22
V3312	JE Exports	San Diego	CA	-116.954	32.572
V3314	Makana Provisons Meat Co Corp.	Honolulu	HI	-157.8	21.294
V3317	Marten's Fresh, LLC	Port Byron	NY	-76.653	43.034
V3322	FreezPak Logistics Suffolk	Suffolk	VA	-76.474	36.818
V3326	Americold Logistics, LLC	Jefferson	WI	-88.812	42.99
V3331	1481 Meats Inc.	Upham	ND	-100.732	48.589
V3332	Simi Xest Sqeltc Sukaxni ni A Kulak of Selis Qlispe and Ksanka, Inc.	Ronan	MT	-114.118	47.529
V3334	AmeriCold Logistics	Carthage	MO	-94.327	37.199
V3335	Coyotarts, LLC	SAN DIEGO	CA	-116.979	32.558
V3338	Lineage Logistics, LLC	Iowa City	IA	-91.494	41.635
V3347	Lineage Logistics, LLC	Bedford Park	IL	-87.794	41.773
V3353	Straka Meats inc.	Plain	WI	-90.046	43.279
V3356	Grocery Outlet Inc.	Sacramento	CA	-121.394	38.536
V3358	Agile Cold New Orleans LLC	Pearl River	LA	-89.755	30.366
V336	KRES Cold Storage , LLC	Vineland	NJ	-75.06	39.54
V3363	Lineage Logistics, LLC	Friona	TX	-102.709	34.639
V3365	Green Bay Dressed Beef, Inc.	Green Bay	WI	-87.98	44.511
V3366	United States Cold Storage, LP	Arlington	TX	-97.049	32.719
V3367	Arctic Cold Storage	St Cloud	MN	-94.156	45.498
V337	STX Beef Company, LLC	Corpus Christi	TX	-97.539	27.822
V3379	Cold Solutions at Rush Creek	Liberty	MO	-94.361	39.209
V3380	GFI Northwest LLC / DBA Gourmet Foods International	Sumner	WA	-122.243	47.236
V33808	Cargill Food Distribution	Logan	NJ	-75.383	39.765
V33812	Halperns' Purveyors of Steak and Seafood	Atlanta	GA	-84.529	33.626
V33814	Buffalo SAV, Inc.	Buffalo	NY	-78.814	42.885
V33830	Americold Logistics, LLC	Fort Worth	TX	-97.352	32.825
V33832	Link Snacks, Inc	Laurens	IA	-94.847	42.849
V3384	Casing Associates, LLC, DBA DCW Casing, LLC	Fair Lawn	NJ	-74.14	40.938
V33866	Firmenich Incorporated	New Ulm	MN	-94.456	44.317
V3389	Pizza By Pappas	Scranton	PA	-75.662	41.41
V339	Oskaloosa Food Products Corp.	Oskaloosa	IA	-92.639	41.287
V33900	Case Farms, Processing	Farmerville	LA	-92.434	32.838
V33917	Dori Foods, Inc.	Richmond	VA	-77.472	37.573
V33928	Lockwood Packing CO, LLC	Lockwood	MO	-93.959	37.388
V33928A	Lockwood Packing CO, LLC	Lockwood	MO	-93.963	37.39
V33935	Vertical Cold Storage, llc	Richardson	TX	-96.72	32.956
V33958	Halpern's Steak and Seafood Company LLC	WALTON	KY	-84.604	38.859
V33960	Tyson Processing Services, Inc.	Bowling Green	KY	-86.29	37.037
V33971	McNees Meats and Wholesale LLC	North Branch	MI	-83.197	43.215
V33973	Cream Co. LLC	Oakland	CA	-122.209	37.759
V33975	Steuben Foods Inc.	Elma	NY	-78.629	42.802
V3398	Lineage Logistics, LLC	Grand Island	NE	-98.353	40.948
V33983	Smithfield Packaged Meats Corp	Sioux City	IA	-96.382	42.484
V34001	Percival Packing L.L.C.	Scott City	KS	-100.916	38.483
V34031	US Foods	Port Orange	FL	-81.038	29.114
V34045	A & M Cold Storage	McAllen	TX	-98.268	26.156
V34052	Freightout.com, LLC	Moriarty	NM	-106.028	34.996
V34056	Olsen Farms Meats	Chewelah	WA	-117.739	48.246
V3406	Saputo	Franklin	WI	-87.954	42.856
V34075	Old Wisconsin Food Products, Inc.	Sheboygan	WI	-87.776	43.806
V34077	Roadrunner Home Bake, Inc.	Gladstone	OR	-122.602	45.388
V34079	M & W Distribution Services	Atlanta	GA	-84.61	33.707
V34081	Prefco Distribution, LLC	Houston	TX	-95.449	29.788
V34092	JBS Prepared Foods-Tupelo Facility	Tupelo	MS	-88.773	34.253
V34095	A1 Meat Solutions, Inc.	El Monte	CA	-118.013	34.062
V34099	Lineage Logistics, LLC	Rincon	GA	-81.25	32.336
V34103	Gentle Harvest	Winchester	VA	-78.137	39.286
V3411	US Commodity Food Sales	Miami	FL	-80.244	25.842
V34133	Royal Provisions, LLC	Dawson	MN	-96.024	44.924
V34138	Hearthside Food Solutions, LLC d/b/a Maker's Pride	Carol Stream	IL	-88.109	41.923
V34140	Americold Logistics, LLC	Darien	WI	-88.731	42.592
V34162	The Hillshire Brands Company	Macon	GA	-83.727	32.728
V34165	Roma Food Enterprises, Inc.	Orlando	FL	-81.413	28.456
V34183A	USA Canning Food	Santa Ana	CA	-117.902	33.747
V34188	Earthwise Industries	Troy	MO	-90.976	38.966
V34190	Commodity Forwarders, Inc.	Lawrence	NY	-73.737	40.616
V34191	Hidalgo Logistics LLC	Hidalgo	TX	-98.25	26.109
V34198	Don's Cold Storage & Transportation	Rogers	AR	-94.127	36.35
V3424	Quirch Foods Florida LLC	Opa Locka	FL	-80.262	25.885
V34244	Eskimo Cold Storage	Gainesville	GA	-83.757	34.237
V34244B	Eskimo Cold Storage - Building #2	Gainesville	GA	-83.757	34.237
V34249	Lone Star Beef Processors, L.P.	San Angelo	TX	-100.402	31.494
V3425	Americold Logistics	Springdale	AR	-94.119	36.195
V34283	Custom Meats of Marathon, Inc.	Marathon	WI	-89.843	44.922
V34290	Chef Minute Meals Inc	Piney Flats	TN	-82.28	36.436
V34293	Thrushwood Farms Quality Meats, Inc.	Galesburg	IL	-90.417	40.947
V3431	Americold Logistics LLC	Fort Worth	TX	-97.334	32.775
V34311	Paden Cold, Inc.	Norfolk	VA	-76.208	36.842
V34327	Shin Provision, Inc.	Cicero	IL	-87.741	41.855
V3433	UTZ Quality Foods	Hanover	PA	-77.001	39.812
V34335	Interstate Warehousing Murfreesboro	Murfreesboro	TN	-86.359	35.781
V3435A	Delato Corporation	San Diego	CA	-116.975	32.563
V34377	T & W Meat Company	Kingman	KS	-98.132	37.648
V34384	Elkton Locker and Grocery, Inc.	Elkton	SD	-96.481	44.237
V34395	US Foods, Inc.	Tracy	CA	-121.388	37.752
V3441	Quirch Foods California, LLC	Vernon	CA	-118.184	33.999
V34412	Nextwave Food Solutions LLC	Albuquerque	NM	-106.668	35.063
V34435	Lineage Logistics PFS, LLC	LaPorte	TX	-95.075	29.696
V34447	Bar-S Foods	Seminole	OK	-96.661	35.261
V34449	Texas Natural Meats	Lott	TX	-97.114	31.121
V34458	HK Cooperative, Inc.	Sandusky	OH	-82.714	41.438
V34461	Lineage Logistics, LLC	Tremonton	UT	-112.197	41.722
V34467	Shamrock Food Company	Commerce City	CO	-104.921	39.789
V34483	Mongiello Italian Cheese Specialties	Hurleyville	NY	-74.684	41.776
V34498	Cargill Food Distribution	Hialeah	FL	-80.371	25.905
V3452	Massy Distribution USA	Jacksonville	FL	-81.628	30.428
V34520	United States Cold Storage of California	Fresno	CA	-119.743	36.69
V3453	Tiny C Snacks, Inc.	Worcester	MA	-71.772	42.296
V34538	The Wornick Company dba Baxters North America, Inc.	Cincinnati	OH	-84.451	39.313
V34545	First Choice Marine Supply	Tampa	FL	-82.39	27.906
V34546	Americold Mullica Hill	Mullica Hill	NJ	-75.256	39.722
V34552	Lineage Logistics PFS, LLC	Chesapeake	VA	-76.338	36.767
V34555	Lineage Logistics PFS, LLC	Jacksonville	FL	-81.687	30.333
V34560	Americold Logistics LLC.	Pedricktown	NJ	-75.411	39.74
V34563	Peacock Cheese	Vernon	CA	-118.231	33.994
V34569	Ohio Farms Packing Co. Ltd.	Creston	OH	-81.918	40.984
V34570	Preferred Freezer Servces of Philadelphia, LLC	Philadelphia	PA	-75.153	39.907
V34578	CJ Logistics America, LLC (3PL for B&G Foods)	Nazareth	PA	-75.29	40.724
V34582	Lineage Logistics PFS, LLC	College Park	GA	-84.407	33.616
V34587	The Hillshire Brands Company	Haltom City	TX	-97.287	32.823
V34589	Country Fresh Meats, Inc.	Weston	WI	-89.501	44.89
V34592	KTF Protein Solutions Inc.	Saint Marys	OH	-84.342	40.53
V34595	Fair Market Inc.	Montgomery City	MO	-91.494	38.96
V34600	Kissimmee River Foods International, LLC	Auburndale	FL	-81.8	28.062
V34606	Saugatuck Kitchens	Stratford	CT	-73.154	41.186
V3461	Americold Logistics	Suffield	CT	-72.623	41.947
V34614	Stonie's Sausage Shop	Perryville	MO	-89.887	37.722
V34626	Infinity Brokerage Co. Inc.	El Paso	TX	-106.434	31.775
V34628	Frito Lay, Inc.	Easton	PA	-75.215	40.746
V3462A	Denver Cold Storage, Inc.	Denver	PA	-76.14	40.229
V3463	Freezer Services of Michigan LLC	Hamtramck	MI	-83.056	42.384
V3464	Americold Logistics	Fogelsville	PA	-75.614	40.589
V3465	Wilmot Productions	Chicago	IL	-87.734	41.931
V3467	Natural Harvest LLC	Spring Green	WI	-90.066	43.188
V34671	Industrial Logistics Group	Kansas City	KS	-94.609	39.122
V3468	Pacific Unlimited Inc	Tiyan	GU	144.804	13.462
V34694	AmeriCold Logistics	Rochelle	IL	-89.035	41.906
V34694A	Americold Logistics	Crest Hill	IL	-88.136	41.578
V34698	Dover Processing, Inc.	Dover	MN	-92.138	43.969
V34705	Lineage Logistics PFS, LLC	Vernon	CA	-118.235	33.993
V34708	Ajinomoto Foods North America	Oakland	MS	-89.906	34.074
V34713	Innovative Foods, LLC	Evans	CO	-104.704	40.368
V34716	Domino's Pizza, LLC	Groveland	FL	-81.828	28.637
V3472	Cut Meat Creek Custom	Chancellor	SD	-96.98	43.459
V34726	NEP Cold Storage Inc.	Philadelphia	PA	-75.013	40.093
V3472A	Cut Meat Creek Custom LLC	Chancellor	SD	-96.98	43.459
V34736	TFC Poultry, LLC	Ashby	MN	-95.816	46.093
V3474	Americold Logistics	Benson	NC	-78.567	35.358
V3475	Americold Logistics, LLC	Green Bay	WI	-87.98	44.507
V3478	Americold Logistics	Russellville	AR	-93.105	35.274
V3479	All Hale Meats, LLC	Wolfforth	TX	-102.025	33.506
V34796	Lineage Logistics Services, LLC	Decatur	AL	-87.043	34.612
V3481	Ryder Integrated Logistics, Inc.	Columbus	OH	-82.96	40.036
V34811A	Cured by Visconti	Wenatchee	WA	-120.324	47.442
V34812	Americold Logistics, LLC	Columbus	OH	-82.935	39.9
V34816	USA Ham LLC	Hialeah	FL	-80.292	25.847
V34823	Pacific Coast Container	Seattle	WA	-122.352	47.586
V34829	Nor-Am Cold Storage, Inc.	Detroit Lakes	MN	-95.839	46.818
V34835	Smithfield Packaged Meats Corp.	Kansas City	MO	-94.673	39.285
V34837	Defiance 326, LLC	Sterling	CO	-103.327	40.711
V3485	FlexXray LLC	Nampa	ID	-116.502	43.605
V3486B	Kandu Industries Inc	Milton	WI	-88.947	42.778
V3504	Americold Logistics, LLC	Fort Smith	AR	-94.38	35.305
V3505	Dakota Gobblers, LLC	Huron	SD	-98.235	44.375
V3507	Zollinger Cold Storage Corporation	Logan	UT	-111.851	41.702
V3515	Palermo Villa	West Milwaukee	WI	-87.964	43.003
V3523	Syracuse Casing Co., Inc.	Syracuse	NY	-76.162	43.05
V3524	Agile Cold Dallas LLC	Kaufman	TX	-96.308	32.589
V3531	United States Cold Storage	Lavergne	TN	-86.601	36.02
V3532	AdvancePierre Foods, Inc.	Claremont	NC	-81.138	35.715
V3538	New Orleans Cold Storage & Warehouse Company, LLC	Fort Worth	TX	-97.315	32.632
V3539	Garros Services LLC	Laredo	TX	-99.726	27.71
V3542	Pacific Agri - Products, Inc.	South San Francisco	CA	-122.391	37.657
V3547	Wald Family Foods LLC	Burlington	IA	-91.159	40.827
V3555	Tyson Fresh Meats, Inc.	Sioux City	IA	-96.374	42.44
V3562	Lineage Logistics, LLC	Lincoln	NE	-96.737	40.848
V3563	Lineage Logistics LLC	Los Angeles	CA	-118.212	34.004
V3563A	Lineage Logistics LLC	Vernon	CA	-118.236	34.005
V3563D	Lineage Logistics LLC	Vernon	CA	-118.2	34.003
V3567	Lineage Logistics MTC, LLC	Tolleson	AZ	-112.289	33.438
V3573	Envision Cold	Albert Lea	MN	-93.354	43.626
V359	Quaker Valley Foods Int'l	Philadelphia	PA	-75.013	40.093
V3600	Kansas City Cold Storage	Kansas City	MO	-94.489	39.08
V3604	Envision Cold	Miami	FL	-80.244	25.842
V3610	Lineage Logistics, LLC	Dodge city	KS	-99.965	37.741
V3627	Venture Protein International	Jackson	TN	-88.813	35.62
V365	Arcadia Cold Charleston, LLC	Ridgeville	SC	-80.315	33.11
V3655	Savoonga Reindeer Commercial Company	Savoonga	AK	-170.494	63.691
V3674	Customized Distribution Services, Inc.	Allentown	PA	-75.429	40.666
V3677	Central Cold Solutions, LLC DBA Central Cold	Conway	AR	-92.402	35.058
V3678	Americold Logistics, LLC	Allentown	PA	-75.621	40.59
V3682	FSM Foods International, Inc	Deerfield Beach	FL	-80.148	26.306
V3683	North Star Bison, Slaughter Division	Conrath	WI	-91.008	45.381
V3688	Americold Logistics, LLC	Newport	MN	-93.011	44.882
V3692	Northstar Bison LLC	Cameron	WI	-91.737	45.412
V3697	GroveFoods	Bethel	CT	-73.42	41.358
V3707	United States Cold Storage, Inc.	Omaha	NE	-95.96	41.218
V3730	Prairie Packing	Comanche	OK	-97.978	34.36
V3731	DHL Supply Chain	Southaven	MS	-90.04	34.99
V3732	Kotick Cold JV, LLC	Laredo	TX	-99.491	27.611
V3734	J&J Quality Meats LLC	Bourbon	IN	-86.077	41.296
V3745	East Coast Seafood, LLC	New Bedford	MA	-70.923	41.65
V3747	Pflug Packaging & Fulfillment	Elwood	IL	-88.135	41.406
V3754	Cold Chain Solutions, LLC	Laredo	TX	-99.476	27.62
V3760	Pasha Logistics LLC	Tacoma	WA	-122.39	47.274
V3764	Nit Noi Provisions	Norwalk	CT	-73.417	41.097
V3766	Langley Foods Inc.	Mount Sterling	KY	-83.925	38.079
V3767	Maid-Rite Specialty Foods, Inc.	Dunmore	PA	-75.614	41.436
V3768	Americold Logistics, LLC.	Wichita	KS	-97.329	37.732
V3770	Southwind Foods	Vernon	CA	-118.219	34.0
V3773	Alta Vista Locker LLC	Alta Vista	KS	-96.491	38.864
V3794A	Georgia Cold Storage Company	Americus	GA	-84.196	32.116
V3808	LYFE Industries LLC	Wakarusa	IN	-86.001	41.534
V3823	Americold Logistics LLC	Anaheim	CA	-117.908	33.855
V3827	VARC Inc.	Viroqua	WI	-90.881	43.57
V3830	NewCold Laurel Operations, LLC	Macon	GA	-83.728	32.731
V3835	Logan Refrigerated Services, LLC	Logan Township	NJ	-75.381	39.764
V3837	FreezPak Logistics	Fall River	MA	-71.094	41.76
V3841	Stemple Creek Meat Company, Inc.	Petaluma	CA	-122.61	38.232
V38443	Michigan Natural Storage	Holland	MI	-86.128	42.797
V38445	S.R. Forwarding, Inc.	Laredo	TX	-99.718	27.719
V3845A	United States Cold Storage, LP	Dallas	TX	-96.897	32.772
V3846	RealCold	Lockhart	TX	-97.703	29.905
V38468	Colorado Premium Foods	Denver	CO	-104.966	39.79
V38474	United States Cold Storage - Wilmington	Wilmington	IL	-88.138	41.321
V38493	Seven Nation Food Company	Mount Vernon	NY	-73.822	40.91
V38511	New S.B.L., Inc.	Chicago	IL	-87.651	41.812
V38523	Ryder System Inc	Mt. Sterling	KY	-83.906	38.098
V38526	The Organic Meat Co.	Cashton	WI	-90.803	43.73
V38528	Lineage Logistics PFS, LLC	Chicago	IL	-87.736	41.816
V38538	Foster Poultry Farms, LLC	Livingston	CA	-120.728	37.39
V38539	Foster Poultry Farms LLC	Livingston	CA	-120.728	37.39
V38556	Heritage Meats	Rochester	WA	-123.079	46.822
V38558	Lineage Logistics MTC, LLC	Baltimore	MD	-76.554	39.269
V3860	Central Storage and Warehouse Co., Inc.	Eau Claire	WI	-91.546	44.853
V3865	Arcadia Cold Chicago, LLC	Joliet	IL	-88.072	41.452
V3871	York Cold Storage Co	York	NE	-97.597	40.873
V3879	Boston Sword and Tuna	Boston	MA	-71.029	42.348
V3880	Xportcold Services LLC	Pharr	TX	-98.208	26.107
V3885	Lineage Logistics MTC, LLC	Olathe	KS	-94.823	38.838
V3898	Nor-Am Cold Storage	Cherokee	IA	-95.553	42.719
V3901	Boone Center Inc.	Moscow Mills	MO	-90.925	38.949
V3923	Americold	San Antonio	TX	-98.432	29.3
V3928	Econo-Pak	Milford	PA	-74.784	41.332
V3929	Global Logistics LLC	Miami	FL	-80.258	25.875
V393	Maersk Logistics & Services USA Inc.	Baytown	TX	-94.891	29.74
V3935	Americold Logistics	Burley	ID	-113.85	42.536
V394	Monogram Meat Snacks, LLC	Chandler	MN	-95.949	43.933
V3941	PermaCold Logistics, LLC	Darien	GA	-81.45	31.408
V3952	Colorado Cold Connect	Fort Morgan	CO	-103.771	40.249
V3969	Americold Logistics	Hatfield	PA	-75.3	40.292
V397	Tilghman Island Seafood LLC	Tilghman	MD	-76.333	38.719
V39889	Hall's Warehouse Corp.	South Plainfield	NJ	-74.398	40.573
V39892	Fresh & Ready Foods LLC	San Fernando	CA	-118.419	34.29
V39898	Bridor USA, Inc.	Bridgeport	CT	-73.163	41.172
V39908	Optimus d.b.a. Marky's	Miami Gardens	FL	-80.215	25.924
V39909	Poultry USA, Inc.	Miami	FL	-80.256	25.837
V39910	Del Valle Brands, Inc.	Medley	FL	-80.321	25.849
V39911	PFG-Empire	Miami	FL	-80.258	25.889
V39912	Moran Foods, LLC dba Save-A-Lot	Plant City	FL	-82.061	28.02
V39913	Jacob Fleishman Cold Storage Inc.	Miami	FL	-80.217	25.85
V39915	LOCUST POINT FARMS, LLC	ELKTON	MD	-75.828	39.559
V39917	Lineage Logistics SCS, LLC	Gadsden	AL	-86.073	33.965
V39918	Hospitality Services Unlimited	Miami	FL	-80.375	25.803
V39919	Flora Fine Foods	Coral Springs	FL	-80.291	26.274
V39920	Gordon Food Service	Miami	FL	-80.247	25.883
V39921	Southeast Frozen Foods	Miami	FL	-80.19	25.948
V39922	Merchant's Market Group, LLC	Riviera Beach	FL	-80.06	26.77
V39923	Walton & Post Inc.	Medley	FL	-80.386	25.86
V39924	BJ's Wholessale Club	Hialeah Gardens	FL	-80.328	25.861
V39925	Sherwood Food Distributors, LLC	Opa-Locka	FL	-80.261	25.885
V39926	Cheney Brothers, Inc.	Riviera Beach	FL	-80.093	26.768
V39926A	Cheney Brothers, Inc.	Riviera Beach	FL	-80.09	26.769
V39927	Southeast Wholesale Foods	Medley	FL	-80.375	25.858
V39928	Olympia Provisions	Portland	OR	-122.664	45.521
V39935	Associated Grocers of FL	Pompano Beach	FL	-80.145	26.216
V39936	Vertical Cold Storage, LLC	Medley	FL	-80.368	25.874
V39940	Genco	Edwardsville	IL	-90.056	38.765
V39942	Farview Farms Meat Company	Topeka	KS	-95.665	39.161
V39943	Bemka Corporation	Ft. Lauderdale	FL	-80.145	26.088
V39944	Prosperity Foodservice Group LLC	Doral	FL	-80.362	25.794
V39946	Prime Line Distributors Inc.	Ft. Lauderdale	FL	-80.18	26.069
V39947	Costco Wholesale	Lake Park	FL	-80.088	26.807
V39949	McCain Foods Snack Plant.	Plover	WI	-89.57	44.456
V39953	American Consolidation & Logistics	Pompano Beach	FL	-80.14	26.221
V39957	Promo International, Inc.	Miami	FL	-80.38	25.884
V39958	ATG Transportation LLC	Port Everglades	FL	-80.121	26.085
V3996	Vista Logistics Group LLC	Hidalgo	TX	-98.233	26.187
V39961	Glenn's Market & Catering, Inc.	Watertown	WI	-88.733	43.196
V39961J	Grandpa Glenn's Pet Treats	Johnson Creek	WI	-88.779	43.088
V39963	Hellmann Worldwide Logistics	Miami	FL	-80.366	25.812
V39967A	Thrive Life	American Fork	UT	-111.787	40.345
V39973	Price Smart, Inc.	Miami	FL	-80.375	25.864
V39973A	PriceSmart	Miami	FL	-80.385	25.876
V39974	Gourmet Foods International	Pompano Beach	FL	-80.159	26.259
V39977	United States Cold Storage	Lake City	FL	-82.567	30.19
V39984	US Foods	Boca Raton	FL	-80.092	26.414
V39991	Quirch Foods	Miami	FL	-80.333	25.843
V39991A	Quirch Foods Co.	Orlando	FL	-81.411	28.449
V39993	Port of Palm Cold Storage	Rivera Beach	FL	-80.085	26.77
V39993A	Port of Palm Cold Storage	Riviera Beach	FL	-80.085	26.77
V3S	Swift Pork Company	Marshalltown	IA	-92.898	42.055
V3W	Swift Pork Company	Worthington	MN	-95.574	43.632
V40008	Lineage Logistics, LLC	University Park	IL	-87.75	41.454
V40016	Lineage Logistics PFS, LLC	Everett	MA	-71.055	42.391
V40017	Northern Culinary Brands, LLC	Plattsburgh	NY	-73.54	44.707
V4002	Legacy Turkey	Melrose	MN	-94.794	45.676
V4005	Williamsburg Packing Company Inc.	Kingstree	SC	-79.815	33.683
V40050	Jose Sanitiago	Bayamon	PR	-66.139	18.427
V40072	Lineage Logistics, LLC	Sunnyvale	TX	-96.567	32.774
V40083	Wilco Cold Storage LLC	Wilson	NC	-77.923	35.697
V4010	Euro Food, Inc., DBA Citterio USA Corporation	Freeland	PA	-75.899	41.011
V40103	Lineage Logistics, LLC	Centralia	WA	-122.999	46.761
V40105	Caine Warehousing LTD	Reeseville	WI	-88.85	43.304
V40109	Schratter Foods, Inc dba Corman Ship Supplies	Miami	FL	-80.385	25.873
V40117	Jerky Junction, Inc	Carson City	NV	-119.724	39.193
V40131	Apollo Export Warehouse Inc.	Miami	FL	-80.324	25.837
V40147	This Old Farm Meats and Processing	Colfax	IN	-86.686	40.194
V40157	Sylvester Quality Meats	Westfield	PA	-77.561	41.965
V40170	LINK & CURE LLC	Chattanooga	TN	-85.304	35.035
V40191	Goya Foods of Florida	Miami	FL	-80.413	25.795
V40193	AdvancePierre Foods, Inc.	Enid	OK	-97.805	36.418
V40197	Delaware Avenue Enterprises Inc.	Philadelphia	PA	-75.14	39.903
V402	Cooking Acquisitions, LLC	Pennsauken	NJ	-75.077	39.928
V40200A	America New York Ri Wang Food Group Co., Ltd.	Bay Shore	NY	-73.269	40.765
V40207	Appalachian Ag, LLC	Prestonsburg	KY	-82.866	37.65
V40221	Prairie Harvest Ltd	Spearfish	SD	-103.875	44.503
V40223A	LeMars Public Storage #3	LeMars	IA	-96.189	42.763
V40226	Grupo Salvatex	Katy	TX	-95.731	29.834
V40227	Innovative Cold Storage Enterprises, Inc.	San Diego	CA	-116.983	32.549
V40228	Russian Style Ravioli Inc.	Roselle	NJ	-74.258	40.647
V4023	Core X Merchants	Walton	KY	-84.625	38.924
V40233	LeMars Public Storage Inc.	LeMars	IA	-96.169	42.79
V40234	Lineage Logistics PFS, LLC	Medley	FL	-80.384	25.891
V40243	Nunez Foods	Miami	FL	-80.257	25.837
V40244	Gray's & Danny's Investment, Inc.	Moore Haven	FL	-81.079	26.782
V4026	Maersk Logistics & Services, USA Inc.	Dayton	NJ	-74.467	40.37
V40264	Rancher's US OP LLC	Vadnais Heights	MN	-93.052	45.071
V40267	Rotex Food Services, Inc.	Deerfield Beach	FL	-80.106	26.296
V40268	Sinton and Sons Local Meats and Provisions	Paso Robles	CA	-120.69	35.651
V40268A	Sinton and Sons Local Meats and Provisions	Paso Robles	CA	-120.533	35.539
V40269	Boyd Specialties LLC	Colton	CA	-117.311	34.055
V4027	NPC Processing, LLC	Shelburne	VT	-73.214	44.406
V40273	Performance Food Group	Gainesville	FL	-82.275	29.703
V40316	Cal Chef Foods, LLC	Stockton	CA	-121.221	37.931
V40316A	CalChef Foods, LLC	Stockton	CA	-121.231	37.936
V4032	US Foods Inc.	Manassas	VA	-77.554	38.787
V40322	Just Mike's Jerky Company	Medina	OH	-81.879	41.137
V40326	Crescent Meats and Catering LLC	Cadott	WI	-91.148	45.065
V40330	J&D Refrigerated Services	Clackamas	OR	-122.537	45.401
V40339	Unicold Corporation	Oakland	CA	-122.312	37.806
V40353	Sysco South Florida	Medley	FL	-80.379	25.888
V40359	Trinity Meat Company LLC	Hartwick	NY	-75.051	42.652
V40366	SnowTemp Cold Storage	Albany	OR	-123.097	44.605
V40373	Lineage Logistics Bedford Park 1, LLC	Bedford Park	IL	-87.797	41.773
V40375A	Villari Food Group	Warsaw	NC	-78.083	34.988
V40381	Champion Foods LLC	New Boston	MI	-83.384	42.131
V40383	The Suter Company	Sycamore	IL	-88.702	41.967
V404	South Chicago Packing LLC	Chicago	IL	-87.649	41.825
V40432	Callicrate Cattle Co.	St. Francis	KS	-101.843	39.689
V40439	Lineage Logistics PFS, LLC	Houston	TX	-95.278	29.781
V40441	Derstine's Inc.	Sellersville	PA	-75.306	40.344
V40457	T.W Food Distributors	West Palm Beach	FL	-80.147	26.721
V40463	Levee Way Processing LLC	North Pole	AK	-147.49	64.777
V404A	Ed Miniat LLC	South Holland	IL	-87.629	41.598
V4059	Rocking Rd Cattle Company	Fairfield	TX	-96.234	31.813
V4064	Americold Logistics LLC	Pedricktown	NJ	-75.411	39.74
V4072	Americold Logistics	Watsonville	CA	-121.765	36.902
V4089	Poultry Products of Manchester, LLC, DBA Prime Source Foods	Londonderry	NH	-71.387	42.93
V4101	FlexXray, LLC	Allentown	PA	-75.606	40.597
V4102	Morasch Meats, Inc	Portland	OR	-122.5	45.552
V4102A	Pressure Safe LLC	Wood Village	OR	-122.423	45.538
V410A	Green Bay Dressed Beef Cold Storage	Green Bay	WI	-87.978	44.509
V4111	Wycen Foods, Inc.	San Leandro	CA	-122.156	37.716
V4121	Custom Corned Beef LLC	Wiggins	CO	-104.057	40.24
V4121A	Custom Made Meals, LLC	Denver	CO	-104.982	39.797
V4126	Fresh Global Produce	Pharr	TX	-98.215	26.094
V4136	Aeronet Worldwide, Inc.	Compton	CA	-118.227	33.866
V4146	Mountain Meat Packing Inc.	Craig	CO	-107.541	40.511
V4156	Western Meat Service	Denver	CO	-104.98	39.799
V417	ECI storage & logistics, inc	Williamstown	NJ	-75.006	39.676
V4174	Bowers Seafood LLC	Palacios	TX	-96.21	28.735
V4187	Wayne Provisions Company, Inc.	Vernon	CA	-118.191	33.995
V4189	Geodis Logistics LLC	Romeoville	IL	-88.099	41.626
V4190	Buderic Inc. DBA RESCO	Hudson	WI	-92.74	44.956
V4192	Dale's Wild West Products	Brighton	CO	-104.819	39.989
V4195	Newport Meat Southern California, Inc.	Irvine	CA	-117.833	33.695
V420	M.G. Waldbaum Company	Wakefield	NE	-96.864	42.273
V420D	M.G. Waldbaum Company	Wakefield	NE	-96.861	42.27
V420G	Husker Pride Farms MG Waldbaum Co.	Wakefield	NE	-96.881	42.308
V420L	Big Red Farms	WAKEFIELD	NE	-96.819	42.293
V420M	Bloom-N-Egg Farm	Bloomfield	NE	-97.705	42.597
V4219	Wald Family Foods, LLC	Omaha	NE	-96.055	41.217
V4221	Stryder Motorfreight USA, Inc.	Tacoma	WA	-122.403	47.251
V4226	Buddy's Kitchen, Inc.	Burnsville	MN	-93.275	44.785
V4226B	Buddy's Kitchen, Inc.	Lakeville	MN	-93.227	44.643
V4246	Webster City Custom Meats, Inc.	Webster City	IA	-93.785	42.472
V425	Northern Pride, Inc.	Thief River Falls	MN	-96.175	48.114
V4251	Frank Brunckhorst Co. L.L.C.	Brooklyn	NY	-73.932	40.704
V4265	Locust Grove Farm	Argyle	NY	-73.488	43.216
V4266	Meat & Fisheries Processing Laboratory	Cobleskill	NY	-74.504	42.671
V4271	GREISE BROTHERS PACKING INC.	CUMBERLAND	MD	-78.743	39.693
V4286	Rosina Food Products. Inc.	Cheektowaga	NY	-78.748	42.869
V4286A	Rosina Food Products, Inc.	West Seneca	NY	-78.759	42.863
V4286B	Rosina Food Products, Inc.	West Seneca	NY	-78.765	42.86
V4286C	Rosina Food Products, Inc.	Buffalo	NY	-78.763	42.86
V4377	Wonder Meats Inc.	Carlstadt	NJ	-74.079	40.832
V44051	Eagle Maritime Services Inc.	Miami	FL	-80.33	25.785
V44055	MSI Express Inc	Grand Prairie	TX	-97.055	32.787
V44064	Chihade International, Inc.	Lawrenceville	GA	-84.026	33.96
V44090	Global Maritime Supply	Pompano Beach	FL	-80.152	26.229
V44091	Global Maritime Supply	Hollywood	FL	-80.176	25.987
V44093	Palos Garza Forwarding, LLC	Laredo	TX	-99.51	27.611
V44111	Best Value Food Products	Miami	FL	-80.249	25.836
V44126	LiDestri Foods, Inc.	Rochester	NY	-77.68	43.187
V44137	Nello's Specialty Meats	Nazareth	PA	-75.283	40.764
V44143	Exel, Inc	Union City	GA	-84.523	33.574
V44144	Japanese Food Distributors	Medley	FL	-80.341	25.865
V44150	Golden Grains Bakery	Charlotte	NC	-80.884	35.16
V44151	JSW Farm Chop Shop, Inc.	Hazel Green	KY	-83.342	37.767
V44170	RANTOUL INVESTMENTS	RANTOUL	IL	-88.205	40.313
V44185	Continental Freightways	Medley	FL	-80.344	25.867
V44187	Sukhi's Gourmet Indian Foods	Hayward	CA	-122.121	37.632
V44188	Ralex International Corp	Meddley	FL	-80.332	25.846
V44189	American Custom Meats LLC	Tracy	CA	-121.434	37.768
V44190	Restaurant Depot, LLC/DBA Jetro Cash & Carry	Miami	FL	-80.229	25.795
V44194	Americold, LLC	Tacoma	WA	-122.393	47.246
V44199	Central Storage & Warehouse Co.	Pleasant Prairie	WI	-87.901	42.535
V44207	Mill Creek Meats and Processing	Marshall	IL	-87.801	39.451
V44214	Loham, Inc.	Colton	CA	-117.322	34.083
V443	Glenn Valley Foods, LLC.	Omaha	NE	-96.019	41.216
V4460	Great American Foods	Newark	NJ	-74.146	40.718
V4465	Nicholas Meat LLC	Loganton	PA	-77.287	41.036
V44739	D Bar B Sausage	Brenham	TX	-96.414	30.146
V44747	Shamrock Foods Company	Mira Loma	CA	-117.554	34.017
V44762	TJ Processors, LLC	Seattle	WA	-122.339	47.564
V44764	SOPAKCO, Inc.	Mullins	SC	-79.263	34.202
V44782	JE Exports	Calexico	CA	-115.502	32.674
V44784	Keller Warehousing and Co-Packing	Napoleon	OH	-84.094	41.39
V44788	Old Fashion Country Butcher	Santa Paula	CA	-119.065	34.347
V44789	Jack Links Beef Jerky	Underwood	IA	-95.685	41.374
V44797	CCB Packaging, Inc.	Hiawatha	IA	-91.691	42.058
V44808	New Orleans Cold Storage & Warehouse Company Ltd.	New Orleans	LA	-90.129	29.915
V44824	Western Meat Processing, Inc.	Modesto	CA	-120.997	37.619
V44827	Kansas Marine	Los Angeles	CA	-118.242	34.039
V44868	Stafford's Custom Meats	Elgin	OR	-117.915	45.553
V44869	Trig's Smoke House	Rhinelander	WI	-89.397	45.656
V4488	Valley Meat Packing Corp.	Newark Valley	NY	-76.118	42.188
V44881	CRISF, Inc.	Coral Gables	FL	-80.259	25.757
V44910	Rising Spring Meat Co.	Spring Mills	PA	-77.566	40.853
V44917	New Marco Foods Inc.	Hialeah	FL	-80.26	25.852
V44924	Head Distributing Company dba Core-Mark	Tampa	FL	-82.355	27.975
V44933	National DCP	Groveland	FL	-81.829	28.639
V44934	Bronson Locker LLC	Bronson	KS	-95.073	37.895
V44950	Schrader Farms, LLC	Romulus	NY	-76.836	42.745
V44954	Global Food Corp.	Medley	FL	-80.382	25.883
V44972	Wyoming Authentic Products LLC	Cody	WY	-109.04	44.514
V44974	Goffle Road Poultry Farm	Wyckoff	NJ	-74.148	40.974
V44982	Sigma Alimentos International, Inc.	Laredo	TX	-99.725	27.717
V4499	Tri-Town Packing Corporation	Brasher Falls	NY	-74.787	44.863
V44999	Brush Meat Processors LLC	Brush	CO	-103.636	40.252
V45015	American Pasteurization Company	West Sacramento	CA	-121.541	38.569
V45018	Americold	Tarboro	NC	-77.567	35.872
V45019	JTP Global, LLC	Forest Park	GA	-84.393	33.63
V45023	International WHSE SVCS.	Fort Lauderdale	FL	-80.124	26.079
V45030	Envision Cold	Savannah	GA	-81.22	32.112
V45031	Cheesewich LTD	Hodgkins	IL	-87.86	41.767
V45063	Del Rosario Enterprises, Inc.	Medley	FL	-80.318	25.846
V45072	Peacock Cheese	Doral	FL	-80.345	25.795
V45073	Vertical Cold Storage LLC	Pooler	GA	-81.248	32.166
V45078	Continental Forwarding Services	Laredo	TX	-99.632	27.654
V45099	Responsible Transportation LLC	Sigourney	IA	-92.18	41.365
V45128	Lineage Logistics PFS, LLC	Houston	TX	-95.247	29.825
V45146	Tropical Foods	Doral	FL	-80.36	25.79
V45158	Food Marketing Consultants, Inc.	Miramar	FL	-80.285	25.982
V45160	Lehigh Valley Meats LLC	Nazareth	PA	-75.284	40.794
V45163	Espuna, LLC	Gloversville	NY	-74.355	43.033
V45165	Best Buy Export LLC	Hialeah	FL	-80.313	25.851
V45176	New England Wagyu, LLC	Center Barnstead	NH	-71.235	43.32
V45194	Castelo Cold Storage LLC	Pharr	TX	-98.217	26.103
V45195	Gateway America LLC	Gulfport	MS	-89.071	30.4
V45200	Niihau Ahiu Provisions LLC	Kaumakani Kauai	HI	-159.626	21.92
V45201	Limit Bid Packing	Odessa	WA	-118.687	47.316
V45208	ASC Lockers, LLC	West Point	NE	-96.707	41.857
V45209	Texas County Meat Processing, LLC	Cabool	MO	-92.1	37.113
V45210	Pennsylvania Food Corporation	Charleroi	PA	-79.886	40.122
V45212	Wakou USA Inc.	Santa Fe Springs	CA	-118.035	33.899
V45232	Marne Specialties and Meats, LLC	Kent City	MI	-85.758	43.22
V45280	Payco Foods Corporation	Bayamon	PR	-66.185	18.407
V45281	Sam's Club Wholesale Trading # 7191	Miramar	FL	-80.303	25.972
V45288	California Ranch Food Company	Vernon	CA	-118.205	34.003
V45289	Frank Brunckhorst Co., L.L.C.	Groveport	OH	-82.942	39.837
V45291	Blue Line Foodservice Distribution	Anaheim	CA	-117.899	33.813
V45293	Kingston-Miami Trading Co.	Miami	FL	-80.221	25.797
V453	AMERICAN FOODS INTERNATIONAL LLC	Doral	FL	-80.345	25.795
V45305	South Florida Trading Corp.	Doral	FL	-80.348	25.785
V45311	Alba Cold Storage	El Paso	TX	-106.472	31.77
V45325	CARGILL FOOD DISTRIBUTION	NORWALK	CA	-118.056	33.894
V45334	OLLI SALUMERIA AMERICANA	OCEANSIDE	CA	-117.29	33.214
V45339	Buckskins L.L.C.	Newton	AL	-85.61	31.252
V45342	DETROIT HALAL PROCESSING PLANT	Fowlerville	MI	-84.034	42.599
V45356	Seaboard Solutions, Inc.	Miami	FL	-80.325	25.846
V45367	SK Food Group	Groveport	OH	-82.926	39.851
V45367A	SK Food Group Inc	Columbus	OH	-82.943	39.825
V45377	3D Meats, LLC	Dalton	OH	-81.719	40.801
V45381	Cooper Farms Liquid Egg Products	Ft. Recovery	OH	-84.776	40.419
V45384	Central Cold Storage Inc.	Castroville	CA	-121.743	36.757
V45388	Crew Concierge	Pompano Beach	FL	-80.157	26.27
V45391	Americold dba AGRO Merchants Group	Summerville	SC	-80.19	33.067
V45395	Americold Logistics, LLC	Gainesville	GA	-83.817	34.267
V45401	Triple C Meats	Anna	IL	-89.148	37.449
V45410	Trinity X-Ray LLC	Fort Worth	TX	-97.357	32.69
V45422	Saba Livestock	Orland	CA	-122.197	39.681
V45427	Phil's Farm	Hutchinson	KS	-98.014	37.992
V45437	KINRO MANUFACTURING LLC	Pembroke Park	FL	-80.181	25.993
V45440	Lineage Logistics LLC	Stevens Point	WI	-89.501	44.511
V45452	America's Custom Brokers, Inc.	Miami	FL	-80.311	25.794
V45459	Waterloo Poultry Processing LLC	Clinton	WI	-88.933	42.575
V45467	Deering's Jerky Co.	Interlochen	MI	-85.802	44.658
V45471	New Angus, LLC	Aberdeen	SD	-98.484	45.428
V45491	United States Cold Storage	Quakertown	PA	-75.347	40.461
V45502	Pulama Lanai	Lanai City	HI	-156.92	20.827
V45525	Pine Creek Processing LLC	Ridgeland	WI	-91.892	45.208
V45526	Katie's Snack Foods	Hilliard	OH	-83.129	40.042
V45532	International Grocers Inc.	Doral	FL	-80.373	25.8
V45543A	Dot Foods, Inc.	Mt. Sterling	IL	-90.758	39.975
V45561	Van-G Trucking, Inc.	Selma	CA	-119.722	36.525
V45571	Rana Meal Solutions	Barlett	IL	-88.222	41.984
V45578	ConAgra Foods Packaged Foods, LLC	Frankfort	IN	-86.574	40.293
V45580	Vertical Cold Storage LLC	Canton	MI	-83.449	42.275
V45581	Michigan Produce Haulers	Fremont	MI	-85.968	43.462
V45585	The Butcher Block & Smokehouse LLC	Versailles	OH	-84.571	40.19
V45593	Alameda Distribution, Inc.	Los Angeles	CA	-118.24	33.999
V45599	Lake Haven Custom Meat Processing, LLC	Sturgeon Lake	MN	-92.716	46.402
V456	Bad River Jerky	Chamberlain	SD	-99.329	43.812
V45623	Good Foods Group, LLC	Pleasant Prairie	WI	-87.914	42.527
V45625	The Flying Meatballs LLC	Easton	PA	-75.268	40.729
V45629	Andy's Meats Inc.	Endeavor	WI	-89.468	43.696
V45656	Lineage Logistics	Charleston	SC	-79.98	32.902
V45669	Allied Caribbean Distribution	Miami	FL	-80.376	25.857
V45671	Cool Port Oakland	Oakland	CA	-122.32	37.803
V45673	Grassland Beef, LLC	Canton	MO	-91.545	40.122
V45682	Sky Blue Enterprises LLC.	Chicago	IL	-87.651	41.812
V45702	Chino Valley Ranchers	Colton	CA	-117.325	34.086
V45705	Meat Processing Career Center	Orient	OH	-83.148	39.803
V45711	Blue Line Food Service Distribution	Canton	MI	-83.443	42.347
V45712	Frank Brunckhorst Co., LLC	New Castle	IN	-85.386	39.872
V45719M	Assemblers Inc.	McCook	IL	-87.835	41.804
V45729	Westcliffe Meats	Westcliffe	CO	-105.479	38.087
V45730	Interport Logistics LLC	Miami	FL	-80.407	25.795
V45731	Sabanero Inc.	Miami	FL	-80.33	25.787
V45742	LSI Specialty Meats	Centerville	TN	-87.481	35.773
V45744	The BrothFarm LLC	Siren	WI	-92.396	45.783
V45751	Progressive Distributors USA LLC	Medley	FL	-80.382	25.883
V45772	Diller Locker Company, LLC	Diller	NE	-96.936	40.107
V45772A	Diller Locker Company	Diller	NE	-96.935	40.11
V45783	Service Cold Storage / Port Everglades Frozen Storage LLC	Fort Lauderdale	FL	-80.142	26.085
V45789	Lineage Logistics, LLC	North Charleston	SC	-80.071	32.941
V45798	Del Monte Capitol Meat Company, LLC	Reno	NV	-119.799	39.551
V458	Cold-Link Logistics Holland LLC	Holland	MI	-86.118	42.735
V45843	Conger Meat Market, LLC	Conger	MN	-93.529	43.614
V45844	KIA LLC	Kula	HI	-156.398	20.649
V45857	US Foods, Inc.	Fontana	CA	-117.518	34.035
V45877	Great Plains Beef	Lincoln	NE	-96.607	40.86
V45886	TF Foods, LLC	San Diego	CA	-117.165	32.884
V45911	Meridian Meat Packers	Meridian	ID	-116.391	43.626
V45914	United States Cold Storage of California	Turlock	CA	-120.892	37.498
V45920	Food Bank for the Heartland	Omaha	NE	-96.042	41.213
V45922	58 Place Seafood Inc.	Maspeth	NY	-73.91	40.723
V45925	Frigopack USA Inc	Elizabeth	NJ	-74.197	40.672
V45969	Liberty Express Miami DBA USA Fish Handlers	Miami	FL	-80.32	25.805
V45987	Saddle Creek Corporation	Atlanta	GA	-84.608	33.7
V45988	Americold	Leesport	PA	-75.959	40.443
V45997	Brooke & Bradford LLC	Salt Lake City	UT	-111.971	40.753
V46	PG Distribution LLC	Laredo	TX	-99.529	27.604
V460	Jaindl Turkey Sales Inc	Orefield	PA	-75.58	40.643
V46009	CJ Foods Manufacturing Beaumont Corporation	Beaumont	CA	-116.996	33.928
V46011	Homestead Farm and Packing, LLC	Lucedale	MS	-88.471	30.982
V46018	Shiners Stash Inc	North Wilkesboro	NC	-81.173	36.154
V46023	Wyoming Legacy Meats, LLC	Cody	WY	-109.057	44.544
V46049	Cargill Meat Solutions	Round Rock	TX	-97.688	30.505
V4607	Hyndman Halal Meat LLC	Hyndman	PA	-78.75	39.767
V46071	Seaboard Triumph Foods	SIOUX CITY	IA	-96.384	42.421
V46072	Quality Pork International Inc. - West Point	West Point	NE	-96.713	41.839
V46089	Caribbean Crescent Inc.	Baltimore	MD	-76.66	39.267
V46090	Big Sky Processing, LLC	Moore	MT	-109.694	46.977
V46101	Neptune Cold Storage	Miami	FL	-80.257	25.841
V46108	Bovine and Swine	Jackson	WY	-110.798	43.463
V46110	DLA Distribution San Joaquin, CA Unitized Group Rations	Tracy	CA	-121.398	37.724
V46124	Cross Partners Cold Storage Inc.	San Diego	CA	-116.979	32.555
V46128	Beaver Dam Cold Storage LLC	Beaver Dam	WI	-88.822	43.496
V46128B	Beaver Dam Cold Storage	Beaver Dam	WI	-88.893	43.425
V46129	Tony Downs Foods	St. James	MN	-94.617	43.987
V46139	Cypress Valley Meat Company	Pottsville	AR	-93.049	35.255
V46153	JCK Inspection	New Brighton	MN	-93.19	45.051
V46160	Thompsons Meats Inc.	Tooele	UT	-112.339	40.531
V46161	Americold	Manchester	PA	-76.722	40.038
V46162	River Bear American Meats	Denver	CO	-104.953	39.77
V46170	Quapaw Food Services Authority	Miami	OK	-94.804	36.919
V46172	JM Watkins, LLC	Maiden Rock	WI	-92.264	44.654
V46186	Red Cloud Food Services	Nashville	TN	-86.708	36.1
V46197	Des Moines Cold Storage (Crossroads Cold Storage)	Des Moines	IA	-93.534	41.567
V46198	Valley Cold Storage & Transportation, LLC	Santa Teresa	NM	-106.703	31.872
V46199	H-E-B, LP	San Antonio	TX	-98.376	29.477
V46200	Caledonia Packing LLC	Caledonia	MI	-85.568	42.797
V46204	Valley Cold Storage & Transportation, LLC	Las Cruces	NM	-106.762	32.267
V46205	Dakota Provisions - West	Huron	SD	-98.253	44.366
V46224	Rase Forwarding LLC	Hidalgo	TX	-98.25	26.112
V46235	His Meat Company	Marshfield	WI	-90.179	44.631
V46241	Menasha Packaging Company	Bolingbrook	IL	-88.093	41.675
V46262	BillyDoe Meats, Inc.	Hoffman Estates	IL	-88.139	42.062
V46264	Link Snacks Inc.	Minneapolis	MN	-93.275	44.979
V46268	Lieb Foods, LLC	Forest Grove	OR	-123.104	45.523
V46276	Cold Terminal of Laredo LLC	Laredo	TX	-99.481	27.618
V46284	Esquivel's Forwarding Agency Inc.	Laredo	TX	-99.497	27.6
V46292	Off the Rail Butchery	Blair	NE	-96.136	41.546
V46324A	Morning Star Poultry	Fort Plain	NY	-74.67	42.884
V46336	Pioneer Meats, Inc.	Big Timber	MT	-109.918	45.838
V46339	Tejas Premium Meats, LLC	Itasca	TX	-97.198	32.208
V46340	The Meat Market	Baraboo	WI	-89.72	43.472
V46345A	Henry Broch Foods	Waukegan	IL	-87.889	42.394
V46361	Pederson Natural Farms, Inc.	Grand Prairie	TX	-97.05	32.775
V46367	Raybern Foods LLC	Shannon	MS	-88.699	34.171
V46379	Peco Foods, Inc	West Point	MS	-88.664	33.594
V46394	Wayne Farms LLC	Decatur	AL	-87.043	34.612
V46417	US Foods	Woodburn	OR	-122.845	45.131
V46419	Fitch Ranch Artisan Meat Company	Craig	CO	-107.543	40.507
V46422	PCC Logistics	Tacoma	WA	-122.387	47.255
V46434	Wahoo Locker LLC	Wahoo	NE	-96.622	41.21
V46447	United States Cold Storage	Laredo	TX	-99.556	27.647
V46451	Americold Logistics	Mansfield	TX	-97.137	32.543
V46458	Food X Inspections LLC	Holland	MI	-86.128	42.797
V46459	Angulo & Aguilar Forwarding, LLC	Laredo	TX	-99.678	27.686
V46466	Lineage Logistics, LLC	Springfield	OH	-83.854	39.839
V46472	Albert's Organic's, Inc.	Sarasota	FL	-82.539	27.393
V46473	Lineage Logistics Services, LLC	Dothan	AL	-85.361	31.227
V46475	Kurzweils Country Meats	Garden City	MO	-94.249	38.594
V46479	Fisher Packing Company	Redkey	IN	-85.166	40.345
V46483	Stormberg Foods LLC	Goldsboro	NC	-77.943	35.385
V46489	Murray Warehousing, Inc.	Beloit	WI	-89.023	42.544
V46497	Conagra Foods Packaged Foods LLC	Fayetteville	AR	-94.178	36.05
V46504	Americold Logistics LLC	Eagan	MN	-93.157	44.853
V46507	US Cold Storage	McDonough	GA	-84.155	33.393
V46516	Stryker Farm LLC	Saylorsburg	PA	-75.33	40.863
V46518	Lineage Logistics PFS, LLC	Chicago	IL	-87.671	41.849
V46528	Pine Valley Ranch LLC	Spencerville	OH	-84.421	40.666
V46538	Family Traditions Meat Company, Inc.	Ackley	IA	-93.058	42.557
V4653A	Agri Star Meat and Poultry, LLC	Postville	IA	-91.581	43.088
V46542	Lopez Foods, Inc.	Yukon	OK	-97.706	35.473
V46544	E.A. Sween Company	Annandale	MN	-94.1	45.255
V46553	Erie Bone Broth, LLC	Cleveland	OH	-81.678	41.508
V46572	Vertical Cold Storage LLC	Dothan	AL	-85.406	31.272
V46574	Bay Island, LLC	Minnetonka	MN	-93.425	44.914
V46577	Yancey's Fancy	Corfu	NY	-78.41	42.992
V46578	Ram Country Meats	Fort Collins	CO	-105.082	40.572
V46584	The Lamb Co-operative Inc.	Pedricktown	NJ	-75.411	39.74
V46592	Denver Wholesale Foods	Ephrata	PA	-76.165	40.19
V46599	Statesboro Logistics Solutions	Statesboro	GA	-81.802	32.414
V46601	Wild Idea Buffalo Suppliers	Hermosa	SD	-102.787	43.751
V46619	Ke'Fruits llc	Carolina	PR	-65.97	18.381
V4662	Piatkowski Riteway Meats Inc.	Niagara Falls	NY	-79.015	43.129
V46640	PJ Food Service, Inc.	Acworth	GA	-84.657	34.087
V46649	Ballester Hermanos, Inc.	Catano	PR	-66.151	18.425
V46657	Assemblers Inc.	Bedford Park	IL	-87.75	41.758
V46661	Miesfeld's Market	Sheboygan	WI	-87.771	43.798
V46668	Vermont Salumi	Barre	VT	-72.503	44.199
V46676	ER Logistics Consultant LLC	Miami	FL	-80.32	25.797
V46690	Market House Meats	Northfield	MN	-93.291	44.505
V46695	Shippers Warehouse Three	Lithia Springs	GA	-84.592	33.769
V46698	Menasha Packaging Company	Groveport	OH	-82.93	39.839
V46700	Cargill Meat Solutions Corporation	Camp Hill	PA	-76.932	40.212
V46706	Northeast Kingdom Processing LLC	St. Johnsbury	VT	-72.014	44.498
V46715A	Midway International Logistics LLC	Watertown	NY	-75.915	43.992
V46738	DHL Supply Chain (USA)	Fort Worth	TX	-97.316	32.845
V46742	Port Logistics Terminal Operations, LLC	Tampa	FL	-82.436	27.912
V46745	Lineage Logistics, LLC	Vernon	CA	-118.219	34.004
V46746	Lineage Logistics, LLC	Vernon	CA	-118.21	34.004
V46763	Star Warehouse	Miami	FL	-80.257	25.837
V46780	Michael Foods Egg Products Company	Norwalk	IA	-93.689	41.462
V46783	Chan and Chan USA, LLC	Bethlehem	PA	-75.428	40.65
V46791	Safe Food X-Ray LLC	Green Bay	WI	-88.057	44.479
V46793	McLane Global	Houston	TX	-95.433	30.012
V46794	Main Processing LLC	Detroit	TX	-95.266	33.662
V46800	Healthway by Labriute LLC	Toms River	NJ	-74.266	39.986
V46828	Dean Street Processing	Bailey	NC	-78.104	35.778
V46833	Express Transfer and Trucking	Pennsauken	NJ	-75.053	39.97
V46840	Seafrigo NA ColdStorage, Inc. dba: AIRFRIGO USA, INC	Elizabeth	NJ	-74.19	40.673
V46840A	Airfrigo USA Inc/Seafrigo Coldstorage Fairmont	Elizabeth	NJ	-74.197	40.672
V46841	Lakeside Refrigerated Services	Swedesboro	NJ	-75.376	39.75
V4686	Arctic Foods USA, LLC	Washington	NJ	-74.97	40.76
V46879	Lineage Logistics PFS, LLC	Avenel	NJ	-74.257	40.579
V46891	DICEX International, Inc.	Laredo	TX	-99.72	27.716
V46902	eGourmet Solutions Inc	Kansas City	KS	-94.609	39.122
V46910	B & R Meat Processing	Winslow	AR	-94.143	35.809
V46922	Global Refrigerated Services	Clinton	AR	-92.458	35.568
V46945	Pane Vita LLC	Rochester	NY	-77.624	43.167
V46950	Ryder System, Inc.	Jonesboro	AR	-90.575	35.815
V46951	My Magic Kitchen, Inc. (DBA MagicKitchen.com)	Kansas City	KS	-94.717	38.984
V46967	Armada Warehouse Solutions, LLC	Romeoville	IL	-88.084	41.668
V46970	307 Meat Company	Laramie	WY	-105.586	41.282
V46979	West Coast Prime Meats, LLC	Brea	CA	-117.917	33.921
V47000	Pak Quality Foods LLC	Fort Worth	TX	-97.097	32.821
V47009	Smithfield Distribution, LLC	North East	MD	-75.992	39.598
V47011	Tyson Fresh Meats, Inc.	Edwardsville	KS	-94.806	39.058
V47014	Husker Meats LLC	Ainsworth	NE	-99.852	42.554
V47027	National Distribution Center	Fayetteville	NC	-78.807	34.986
V47028	Midsouth Packers, LLC	Forsyth	GA	-83.954	32.968
V47031	Empire Custom Processing, LLC	Bridgewater	NY	-75.25	42.884
V47032	Heart O' Lakes Quality Meats	Pelican Rapids	MN	-96.086	46.584
V47033	Salsabil Meat Processing	Nelliston	NY	-74.61	42.927
V47037	Quality Steak Inc.	Voorhees	NJ	-75.011	39.852
V47056	TC Provisions, Inc.	Farmingdale	NY	-73.452	40.728
V47061	Del Caribe Meat, Inc	Bronx	NY	-73.909	40.831
V47069	United Meat Market	El Paso	TX	-106.472	31.758
V47070	IPMF, LLC., d/b/a Naturpak	Janesville	WI	-89.013	42.633
V47079	Tribal Meat LLC	Milo	IA	-93.441	41.287
V47093	United States Cold Storage	Denton	TX	-97.18	33.217
V47094	SDV Logistics, LLC	El Paso	TX	-106.325	31.671
V47099	True Grade, LLC	Miami	FL	-80.188	25.947
V471	Bar-S Foods Co.	Clinton	OK	-98.962	35.51
V47104	Fort Worth Meat Packers LLC	Fort Worth	TX	-97.348	32.812
V47104B	Fort Worth Meat Packers LLC	Fort Worth	TX	-97.348	32.812
V47114	Outlook Group, LLC	Neenah	WI	-88.53	44.202
V47126	High Country Meats	Raton	NM	-104.446	36.884
V47151	Crowes Butcher Shop	Henagar	AL	-85.692	34.692
V47157	Lineage Logistics PFS, LLC	Jacksonville	FL	-81.741	30.33
V47159	Americold Logistics, LLC	Bloomingdale	GA	-81.386	32.128
V47160	Lineage Logistics PFS, LLC	Hialeah	FL	-80.365	25.919
V47172	FBS Hudson	Hudson	WY	-108.59	42.901
V47178	Hormel Foods Corporation	Groveport	OH	-82.926	39.843
V47181	Quality Cut Meats	Cascade	WI	-88.011	43.655
V47186	Cloud's Meats Inc.	Carthage	MO	-94.346	37.153
V47193	United States Cold Storage	Prince George	VA	-77.303	37.204
V47200	Star Valley Meat Block	Thayne	WY	-111.003	42.92
V47203	Costco Packaging 910	San Diego	CA	-116.929	32.559
V47209	Terminal Freezers	Watsonville	CA	-121.766	36.904
V47212	Harrison Poultry Inc.	Lawrenceville	GA	-84.001	34.043
V47214	GW BEEF COMPANY LLC	Washington	OK	-97.478	35.106
V47216	In't Veld's Meat Market	Pella	IA	-92.916	41.407
V47227	Clean Chickens and Co.	Elk River	MN	-93.549	45.32
V47248	Bluegrass Lamb Company, LLC	Glendale	KY	-85.858	37.615
V47251	Genuine Meats LLC	Riverton	WY	-108.453	43.056
V47258	Cargill Meat Solutions Corporation	North Kingstown	RI	-71.463	41.603
V47261	Nordik Meats Inc	Viroqua	WI	-90.888	43.612
V47264	New Mexico's Best, LLC	Roswell	NM	-104.524	33.374
V47273	Prairie Meats, Inc.	Olivia	MN	-95.023	44.777
V47282	Top Notch Jerky LLC	Sugar City	ID	-111.753	43.878
V47287	Project Meats LLC	Billings	MT	-108.358	45.902
V47287A	Ranch House Snacks	Billings	MT	-108.433	45.804
V47288	Road 39 Ranch Meats, LLC	Mancos	CO	-108.344	37.31
V47306	Associated Grocers of Florida	Miami	FL	-80.19	25.948
V47318	Driftless Provisions, LLC	Viroqua	WI	-90.887	43.572
V47347	Nor-Am Logistics South LLC	Dodge City	KS	-99.986	37.745
V47358	SSI Foods LLC	Amarillo	TX	-101.722	35.236
V47379A	Old Country Jerky	Lynbrook	NY	-73.672	40.655
V47386	Corfini Gourmet	Brisbane	CA	-122.417	37.689
V47392	Well Luck Co., Inc.	Jersey City	NJ	-74.092	40.681
V47405	Savello USA, Inc.	Hanover Township	PA	-75.934	41.226
V47406	Mutual Trading Co., Inc.	El Monte	CA	-118.047	34.086
V47409	Hertzog Meat Co. South LLC	Butler	MO	-94.351	38.256
V47409A	Hertzog Premium Beef LLC	Butler	MO	-94.35	38.323
V47420	Western Heritage Meat Company	Sheridan	WY	-106.928	44.8
V47423	FW Logistics- Montezuma Cold Facility	Montezuma	GA	-84.009	32.298
V47436	Envision Cold	Oakland	CA	-122.188	37.751
V47483	Renegade Processing, LLC	Becker	MN	-93.866	45.384
V47484	The Durand Smokehouse LLC	Durand	WI	-91.939	44.64
V47489	Leidy's, LLC	Allentown	PA	-75.6	40.567
V47491	DC Meat Inc	Duchesne	UT	-110.216	40.172
V47500	Gibbon Packing LLC/American Foods Group	Grand Island	NE	-98.35	40.949
V47511	CJ Logistics America, LLC	Beaumont	CA	-116.996	33.928
V47515	Agile Cold ATL NW, LLC	Cartersville	GA	-84.874	34.222
V47516	Winchester Cold Storage	Winchester	VA	-78.152	39.198
V47517	Winchester Cold Storage	Winchester	VA	-78.163	39.194
V47518	Zimmerman Meats LLC	Summersville	MO	-91.715	37.197
V47532	A Portus Freight Forwarding Service, LLC	Pharr	TX	-98.214	26.095
V47533	Montana Premium Processing Cooperative	Havre	MT	-109.723	48.555
V47534	Agile Cold ATL NE, LLC	Gainesville	GA	-83.753	34.236
V47541	Double L Meat Processing	Jonesville	VA	-83.259	36.698
V47542	Knauss Foods	Quakertown	PA	-75.32	40.423
V47543	Swift Pork Company	Worthington	MN	-95.656	43.559
V47545	ONE-OCEAN CARGO LLC	Medley	FL	-80.377	25.885
V47547	Intermountain Packing, LLC	Idaho Falls	ID	-112.013	43.526
V47555	6 in 1 Meats, LLC	New Salem	ND	-101.406	46.839
V47558	Allen Brothers	Opa-Locka	FL	-80.291	25.906
V47559	Tyson Sales and Distribution, Inc.	Fort Worth	TX	-97.315	32.632
V47565	Lineage Logistics, LLC	Joliet	IL	-88.026	41.506
V47575	Lineage Logistics LLC	Seattle	WA	-122.38	47.633
V47580	Farm Creek Meats, LLC	Duchesne	UT	-110.394	40.191
V47589	HILLANDALE FARMS	Doral	FL	-80.32	25.805
V47593	InterChange Group, Inc.	Mt. Crawford	VA	-78.915	38.369
V47599	Niagara Food Specialties USA, Inc.	Lyndonville	NY	-78.465	43.346
V47612	Premium California Foods	Winton	CA	-120.615	37.373
V47613	IN AND OUT LOGISTICS	DORAL	FL	-80.353	25.786
V47615	S Ranch Meats, LLC	Hardin	MT	-107.592	45.735
V47622	Caribbean Protein Supply LLC	Medley	FL	-80.38	25.885
V47623	PERMAFROST WAREHOUSING, INC	Miami	FL	-80.257	25.836
V47624	Daniels Gourmet Meats	Bozeman	MT	-111.042	45.7
V47653	West Palm Cold Storage LLC	Rivera Beach	FL	-80.09	26.772
V47656	Prime Country Meats	Horatio	AR	-94.312	33.935
V47657	HapCor	Miami Gardens	FL	-80.271	25.97
V47674	Producers Partnership	Livingston	MT	-110.334	45.701
V47678	Lorenz and Hammond, LLC dba Oxbow Meats	Lawrenceburg	KY	-84.872	37.966
V47690	IP TRADING Florida LLC	Miami	FL	-80.189	25.946
V47695	JE Exports	Calexico	CA	-115.378	32.676
V47700	American Foods International LLC	Doral	FL	-80.366	25.812
V47708	Yankee Trader Seafood, Ltd., DBA Emma-Leigh & Co.	Hingham	MA	-70.92	42.163
V47710	Black River Meats	Withee	WI	-90.638	45.064
V47737	Lineage Logistics, LLC	Savannah	GA	-81.143	32.061
V47759	VNT IMEX Inc.	La Mirada	CA	-118.009	33.881
V47762	Fayman & Sorbello Food Group LLC	Madill	OK	-96.762	34.09
V47766	Shoals Cold Storage	Florence	AL	-87.668	34.797
V47780	Americold Logistics- Gateway	Atlanta	GA	-84.594	33.723
V47787	Atlanta Bonded Warehouse Corporation	Kennesaw	GA	-84.615	34.006
V47797	Outback Premium Meats LLC	Forreston	IL	-89.578	42.126
V47798	Best Deal Brokerage LLC	Vernon	CA	-118.183	34.0
V47798A	Best Deal Brokerage LLC	Vernon	CA	-118.239	34.011
V47805	New Hira Farm LLC	Tomball	TX	-95.73	30.04
V47815	South Canadian Meats LLC	Thomas	OK	-98.721	35.74
V4782	Jimmy E, Inc.	Brooklyn	NY	-74.022	40.647
V47829	Supply Chain Solutions, LLC	Lockport	IL	-88.004	41.622
V47831	BG Foods N.A., Inc.	Union City	GA	-84.555	33.569
V47836	Vertical Cold Storage, LLC	Bolingbrook	IL	-88.129	41.663
V47868	Houston Sausage Inc.	Houston	TX	-95.58	29.705
V4788	Rock Run Butchering Company, LLC	Newville	PA	-77.417	40.24
V47885	Cold Terminal of Laredo LLC	Laredo	TX	-99.477	27.685
V47886	Blair Meat Market LLC	Blair	WI	-91.239	44.291
V47903	FlexCold, LLC	Jacksonville	FL	-81.573	30.436
V47905	JBS Prepared Foods	Columbia	MO	-92.276	39.003
V47909	Lineage Logistcs	Salem	OR	-123.011	44.906
V47912	Burly Brothers Country Butchery	Attica	NY	-78.207	42.861
V47915	BMB Ventures	White Sulphur Springs	MT	-110.91	46.542
V47916	Lighthouse Custom Meats LLC	Bloomfield	IN	-87.01	39.031
V47925	Frozen Spot CORP.	Medley	FL	-80.367	25.872
V47928	Midwest Meat Company	Minden	NE	-98.933	40.503
V47932	Coastal Pacific Food Distributors	Ontario	CA	-117.619	34.052
V47932A	Coastal Pacific Food Distributors	Ontario	CA	-117.616	34.05
V47941	ColdPoint Logistics Warehouse	Edgerton	KS	-94.942	38.777
V47946	ColdQuest Inc.	Holland	MI	-86.107	42.85
V47958	Americold Logistics, LLC	Baytown	TX	-94.888	29.726
V47969A	Rocky Mountain Meats LLC	Cortez	CO	-108.611	37.32
V47971	Ajinomoto Foods North America	Joplin	MO	-94.396	37.056
V47980	Frez-N-Stor - Greenville, LLC	Greenville	TX	-96.138	33.129
V47986	Sorbello Refrigerated Services	Vineland	NJ	-74.991	39.508
V47992	Vortex Cold Storage	Albert Lea	MN	-93.365	43.625
V47993	Mason Hills LLC	Grand Bay	AL	-88.318	30.451
V4800	Eddy Packing Co., Inc.	Yoakum	TX	-97.141	29.312
V48066	Route 66 Meat Processing	Sayre	OK	-99.647	35.252
V48082	California Farms Meat Company Inc.	Vernon	CA	-118.205	34.003
V48085	Conagra Brands	Modesto	CA	-120.98	37.603
V48087	Marin Sun Farms, Inc.	Petaluma	CA	-122.647	38.251
V48098	Mistica Foods	Addison	IL	-87.991	41.916
V48118	Americold Logistics, LLC	Monmouth	IL	-90.642	40.93
V48120	AdvancePierre Foods, Inc	Caseyville	IL	-90.056	38.61
V48124	Rava Forwarding Inc.	Laredo	TX	-99.481	27.612
V48125	Laredo Cold Storage LLC	Laredo	TX	-99.72	27.719
V48132A	Goodwell Foods, LLC	Pittsfield	NH	-71.33	43.305
V48142	Smithfield Packaged Meats Corp.	Greenfield	IN	-85.901	39.832
V48144C	Abe's Kosher Meats	Heyburn	ID	-113.764	42.55
V48159	Regional Food Bank of Oklahoma	Oklahoma City	OK	-97.615	35.431
V48160	Molokai Wildlife Management, LLC	Hoolehua	HI	-157.127	21.146
V48160A	Molokai Wildlife Management, INC	Haiku	HI	-156.303	20.865
V48161	Eggert Slaughtering, Inc.	Deer Park	WI	-92.278	45.165
V48163	United States Cold Storage LLC	Hazleton	PA	-76.054	40.936
V48172	Lonsdale Packaging, LLC.	Lonsdale	MN	-93.416	44.476
V48181	Ashton Farms Custom Meats	Fillmore	UT	-112.278	39.001
V48183	IPMF, LLC., dba Naturpak	Janesville	WI	-88.955	42.674
V48194	Lineage Logistics Services, LLC	Long Beach	CA	-118.217	33.777
V48204B	Kingsland Food Processing Corp	South Plainfield	NJ	-74.431	40.568
V48205	ColdPoint Logistics Warehouse, LLC	Edgerton	KS	-94.949	38.799
V48210	Kentucky Meat Smith LLC	Science Hill	KY	-84.634	37.193
V48211	Multimodal Logistics, Inc.	Laredo	TX	-99.512	27.617
V48219	Panola County Processing LLC	Carthage	TX	-94.269	32.104
V48227	Artisan Chef Manufacturing Company DBA: Tuscan Market	Lawrence	MA	-71.171	42.7
V48235	Crescent Specialty Foods, LLC	Farmingdale	NY	-73.413	40.754
V48237	Mei's Trading	Hollywood	FL	-80.224	26.046
V48246	Friends Cargo Int'l	Opa Locka	FL	-80.277	25.909
V48254	DCW Casing LLC	West Sacramento	CA	-121.569	38.549
V48260	Legacy Custom Meat Processing	La Grange	TX	-96.797	29.9
V48273	Cold Front Logistics, LLC	Sedalia	MO	-93.234	38.713
V48281	White Lake Foods, LLC	Ferndale	NY	-74.741	41.753
V48285	A Butchery Shoppe	Spring Valley	WI	-92.238	44.843
V48287	Quality Custom Meats, LLC	Howard	SD	-97.52	44.008
V48298	A Farm Inc.	South El Monte	CA	-118.039	34.047
V48309	Ameri-Asian Trading Development, Inc.	Denver	CO	-104.857	39.783
V48311	Seafrigo Coldstorage Chicago Inc.	Chicago	IL	-87.737	41.814
V48313	Americold Logistics, LLC	North Little Rock	AR	-92.246	34.768
V48315	Safety Fresh Foods LLC	Plymouth	WI	-87.973	43.739
V48465	Meat Science and Animal Biologics Discovery	Madison	WI	-89.419	43.076
V48477	Quirch Foods Southeast, LLC	Atlanta	GA	-84.248	33.909
V4872	Modern Meat, Inc	San Bernardino	CA	-117.256	34.136
V4894	Apple Valley Farms Inc.	Fresno	CA	-119.789	36.759
V4907	Hearthside Food Solutions LLC d/b/a Maker's Pride	Salt Lake City	UT	-112.03	40.779
V4912	H. F. Meats, Inc.	La Crescenta	CA	-118.241	34.224
V4968A	Great Western Meats	Las Vegas	NV	-115.094	36.237
V4972	R&R Quality Meat Inc.	Anderson	CA	-122.361	40.492
V4976	RMFF Holdco LLC	Englewood	CO	-105.009	39.665
V4989	K&M Meat Packing Co., Inc.	Vernon	CA	-118.229	34.013
V4993	Whiskey Hill Smokehouse LLC	Hubbard	OR	-122.806	45.181
V4D	Campbell Soup Supply Company	Napoleon	OH	-84.121	41.386
V4K	Campbell Soup Supply Company L.L.C.	Paris	TX	-95.562	33.685
V500A	Land O'Frost, Inc	Searcy	AR	-91.728	35.239
V5057	The Alpine Wurst & Meat House	Honesdale	PA	-75.218	41.551
V50775	Fleish Yavesh, Inc.	Hewlett	NY	-73.688	40.649
V50789	Monogram Gourmet	Medford	MA	-71.081	42.414
V50804	Koehler's Meat and Sausage Company	Gillette	WY	-105.484	44.248
V51174	Synergy Flavors Innova LLC	Chicago	IL	-87.662	41.827
V51179	Sanderson Farms, Inc.	Palestine	TX	-95.7	31.729
V51184	Bauman's Butcher Block	Ottawa	KS	-95.294	38.522
V51205	BrucePac	Durant	OK	-96.349	33.997
V51210	Alabama Catfish LLC	Uniontown	AL	-87.504	32.45
V51212	Dongsuh Inc.	Maywood	CA	-118.192	33.995
V51217	Haring Catfish	Wisner	LA	-91.679	31.969
V51226	Renderology, LLC	Camp Verde	AZ	-111.858	34.567
V51235	Detroit Cold Storage	Livonia	MI	-83.344	42.38
V51242	Bolke-Miller Company	Waukegan	IL	-87.903	42.336
V51249	McElwee Butchering, LLC	Newville	PA	-77.406	40.134
V51259	CDI - Customized Distribution, LLC	Jacksonville	FL	-81.742	30.342
V51261	Mercado Meat Distribution	Willows	CA	-122.194	39.526
V51264	Port of Wilmington Cold Storage	Wilmington	NC	-77.95	34.191
V51271	Institution Food House (IFH)	Hickory	NC	-81.362	35.74
V51283	Dean & Peeler Meatworks	Poth	TX	-98.092	29.078
V51285	MS Worldwide Logistics, Inc.	Laredo	TX	-99.719	27.72
V51286	Innova Flavors	Chicago	IL	-87.662	41.827
V51295	SK Food Group	Tolleson	AZ	-112.222	33.442
V51296	Americold Logistics, LLC	East Point	GA	-84.43	33.691
V51298	West Coast Prime Meats LLC	Brea	CA	-117.917	33.921
V51303	USA Beef Packing, LLC	Roswell	NM	-104.425	33.364
V51306	Powell Meat Company LLC	Clinton	MO	-93.775	38.386
V51311	Lineage Logistics PFS, LLC	Pasadena	TX	-95.08	29.61
V51322	World Food P&D, Inc.	Commerce	CA	-118.135	34.004
V51327	B&A Gourmet Foods LLC	Hialeah	FL	-80.359	25.915
V51333	Bell Flavors & Fragrances	Northbrook	IL	-87.859	42.144
V51340	Eagle Grove Cooperative	Eagle Grove	IA	-93.912	42.59
V5137A	Nardone Brothers Baking Company, LLC	Hanover Township	PA	-75.923	41.207
V51545	Win Chill Cold Storage, LLC	Sioux Falls	SD	-96.779	43.625
V5155	Sahlen Packing Company, Inc.	Buffalo	NY	-78.842	42.884
V51556	Smithfield Distribution, LLC	Tar Heel	NC	-78.808	34.749
V5200	Prime Food Distributor, Inc.	Port Washington	NY	-73.664	40.814
V5223	Manchester Packing Co., Inc.	Hartford	CT	-72.658	41.748
V529	Pilgrim's Pride Corporation	Arcadia	WI	-91.511	44.258
V5297	Big Dog Meats LLC	West Haven	CT	-72.992	41.265
V532	Lineage Logistics PFS, LLC	Newark	NJ	-74.129	40.723
V5333	Zweigle's Inc.	Rochester	NY	-77.626	43.164
V5342	Seviroli Foods, LLC	Garden City	NY	-73.611	40.729
V537	Kraft Heinz Foods Company	Davenport	IA	-90.61	41.617
V5370	Whitsons Food Services (Bronx), LLC	Brooklyn	NY	-74.022	40.647
V5382	Cifelli Sausage LLC	Sayreville	NJ	-74.342	40.429
V53858	McLean Beef Inc	York	NE	-97.599	40.832
V53859	Chunwei Inc.	Ontario	CA	-117.608	34.047
V53871	FlexXray LLC	Fort Mill	SC	-80.929	35.092
V53873	Hudson Lockers	Hudson	CO	-104.644	40.074
V53875	AMG Global Distribution, Inc.	Miami	FL	-80.19	25.947
V53876	Blue Creek Marbled Meat Company LLC	Billings	MT	-108.425	45.673
V5390A	North Country Smokehouse	Claremont	NH	-72.387	43.339
V5421	Spolem Provisions,LLC	Hamilton	NJ	-74.726	40.245
V54250	Nor-Am Ice & Cold Storage, LLC	Elwood	KS	-94.886	39.754
V54264	Cordele Cold Storage & Food Processing, LLC	Cordele	GA	-83.74	31.969
V54269	DuFour Gourmet	Long Island City	NY	-73.95	40.752
V5430	Bierig Brothers Inc.	Vineland	NJ	-75.054	39.539
V548A	Yosemite Foods Inc.	Stockton	CA	-121.221	37.931
V5497	Adams Farm Slaughterhouse LLC	Athol	MA	-72.2	42.595
V54A	Daniele Operating, LLC - Stedagio	Mapleville	RI	-71.642	41.947
V5520	Nordic Foods Inc.	Kansas City	KS	-94.687	39.095
V5533	West Liberty Foods, LLC	West Liberty	IA	-91.266	41.569
V5541A	Native American Enterprises, LLC	Wichita	KS	-97.389	37.687
V5541B	Native American Enterprises, LLC	Wichita	KS	-97.388	37.642
V555	One World Specialties	Las Vegas	NV	-115.126	36.066
V5561A	Bar-W Meat Company, LLC	Fort Worth	TX	-97.297	32.768
V5562	S&S Quality Meats	Emporia	KS	-96.248	38.414
V5617	Cargill Kitchen Solutions	Monticello	MN	-93.798	45.304
V5622	Albion Locker	Albion	NE	-97.998	41.692
V5648	Lake Geneva Country Meats, Inc	Lake Geneva	WI	-88.35	42.594
V5650	Custom Pack Inc.	Hastings	NE	-98.389	40.567
V5658	Loeffel Meat Laboratory / Animal Science Department	Lincoln	NE	-96.664	40.832
V5659	Schubert's Smokehouse Packing Co., Inc.	Millstadt	IL	-90.09	38.455
V565A	Montgomerys Meats Inc	Central Point	OR	-122.919	42.376
V565B	Montgomerys Meats Inc	Central Point	OR	-122.907	42.399
V5666	Quality Sausage Company, LLC	Dallas	TX	-96.859	32.771
V5666T	Quality Sausage QOZ, LLC	Dallas	TX	-96.859	32.77
V5668	Food Solutions 2, Inc.	Denver	CO	-104.85	39.787
V5686	Wausa Lockers Inc.	Wausa	NE	-97.538	42.499
V5688	Ajinomoto Foods North America	Toluca	IL	-89.137	41.007
V5694A	Kent Quality Foods, Inc.	Hudsonville	MI	-85.869	42.838
V5697	Swanson Meat Co.	Minneapolis	MN	-93.235	44.953
V5699	Richelieu Foods, Inc.	Beaver Dam	WI	-88.826	43.476
V5726	Fairbury Steaks, Inc.	Fairbury	NE	-97.181	40.136
V5729	Twin Loups Quality Meats	St Paul	NE	-98.46	41.213
V5766	Alewel's Country Meats	Warrensburg	MO	-93.736	38.778
V5779	Green Hills Fresh Meats	Brookfield	MO	-93.041	39.794
V578	James Calvetti Meats, Inc.	Chicago	IL	-87.651	41.816
V5788	Liberty Locker	La Belle	MO	-91.91	40.114
V579	Jennie-O Turkey Store	Faribault	MN	-93.276	44.303
V5798	Williams Brothers Meat Market	Washington	MO	-91.011	38.552
V580	A. Decoite Packing House, Inc.	Haiku, Maui	HI	-156.301	20.865
V5819	Gourmet Ranch	Houston	TX	-95.505	29.926
V5842	Tyson Foods, Inc.	Springdale	AR	-94.126	36.19
V5886	Goodman Food Products	Inglewood	CA	-118.352	33.967
V5916	Longhini, LLC	New Haven	CT	-72.949	41.295
V5934	A.F.I. Food Service LLC "DBA" PFS Metro NY Custom Cuts	Elizabeth	NJ	-74.171	40.671
V595	Old World Provisions Inc.	Troy	NY	-73.676	42.706
V6	Tyson Foods, Inc.	Blountsville	AL	-86.584	34.058
V6004	Wolf Pack Meats	Reno	NV	-119.734	39.513
V6010T	National Steak Processors (2024), LLC.	Owasso	OK	-95.851	36.26
V6016	Papa Cantella's Inc	Vernon	CA	-118.207	33.999
V6028A	West Coast Prime Meats LLC	Brea	CA	-117.889	33.923
V6045	Valley Meat & Food LLC	Alamosa	CO	-105.875	37.464
V6075	E.C. Wilson Co., Inc.	Brier	WA	-122.26	47.798
V6076	Scotty's Country Smokehouse	Idaho Falls	ID	-112.009	43.537
V6076A	Glenwood Snacks LLC	Saint Anthony	ID	-111.686	43.947
V6076B	Scotty's Country Smokehouse	Idaho Falls	ID	-112.009	43.537
V6124	Compass Foods, Inc.	Modesto	CA	-120.996	37.621
V6130	Towerhouse	San Diego	CA	-117.146	32.707
V6147	Overhill Farms, Inc.	Vernon	CA	-118.224	34.006
V6149	Central Meat and Provision Company	San Diego	CA	-117.15	32.704
V6161	Colorado Custom Meat Company, LLC	Kersey	CO	-104.561	40.386
V6172	Taylor's Sausage, Inc.	Cave Junction	OR	-123.652	42.165
V62	Piazza's Seafood World, LLC	St. Rose	LA	-90.286	29.988
V6206	Fabrique Delices, LLC	Hayward	CA	-122.063	37.613
V6211A	Baxters North America	Salem	OR	-123.053	44.946
V6211I	Baxters North America	Salem	OR	-123.055	44.946
V6211K	Baxters North America	East Bernstadt	KY	-84.128	37.177
V6220A	Idaho Smokehouse Partners LLC	Shelley	ID	-112.121	43.394
V6232	Ready Foods, Inc.	Denver	CO	-104.931	39.773
V6236	Flocchini Family Provisions, Inc.	Carson City	NV	-119.764	39.181
V6239	Shamrock Foods Company	Phoenix	AZ	-112.123	33.477
V6250	JBS USA	Denver	CO	-105.016	39.717
V6251	Jobbers Meat Packing Co Inc	Los Angeles	CA	-118.207	33.996
V6266	LJD Holdings, Inc.	Boise	ID	-116.193	43.571
V6271	Stillwater Packing Co.	Columbus	MT	-109.277	45.668
V6273	House Of Smoke, Inc.	Fort Lupton	CO	-104.811	40.087
V6281	Russak's Cured & Smoked Products	Los Angeles	CA	-118.226	34.044
V6354	E.L. Blood & Son, Inc.	West Groton	MA	-71.621	42.601
V6358	South Coast Gormet Sausage, Inc.	Fall River	MA	-71.135	41.689
V639	Carteret Abattoir	Carteret	NJ	-74.229	40.571
V6407	Laurienti & LaBate Meat, Inc.	Denver	CO	-104.978	39.829
V6423	Rainier Pure Beef Company	Woodland	WA	-122.744	45.892
V6426	Tcm, Inc.,	Olympia	WA	-122.846	47.037
V6432	Continental Sausage, Inc.	Denver	CO	-104.975	39.834
V6437	Evergreen Meats Inc.	Port Angeles	WA	-123.442	48.12
V6444	Angus Meats, Inc.	Spokane	WA	-117.387	47.684
V6454	Elizabeth Locker Plant, Inc.	Elizabeth	CO	-104.596	39.362
V6460	Scanga Meat Company	Salida	CO	-106.01	38.553
V6463	Praire Meats, LLC	Brush	CO	-103.596	40.161
V6467	Steele's Meat Co. LLC	Lafayette	CO	-105.107	40.001
V6474	Polidori Meat Processors Inc.	Denver	CO	-104.931	39.77
V6476	Tico's Mexican Foods	Denver	CO	-104.99	39.68
V6496	Prairie Meats LLC	Brush	CO	-103.624	40.252
V65	Kearny Cold Storage	Kearny	NJ	-74.133	40.768
V6561	Volunteer Meats LLC	Lexington	TN	-88.279	35.632
V6608	Bighams Ham Company	Cornersville	TN	-86.746	35.294
V6613	Tennesse Valley Packing Co., Inc.	Columbia	TN	-87.031	35.621
V6616	Peco Foods, Inc.	Sebastopol	MS	-89.324	32.575
V664	Buckhead Meat Company	Warwick	RI	-71.446	41.731
V6719	Pilgrim's Pride Corporation	Chattanooga	TN	-85.304	35.038
V6725	Copper Cellar Corp	Knoxville	TN	-83.968	35.978
V676	RRR Meat Processing	Buckley	MI	-85.686	44.489
V6775	Calihan Processing Cooperative	Peoria	IL	-89.612	40.674
V6791	Knaus Sausage House	Kimball	MN	-94.301	45.313
V6797	Ogden Foods, LLC	Chicago	IL	-87.732	41.848
V6806	Morgan Foods, Inc.	Austin	IN	-85.808	38.746
V6810	Meats By Linz	Hammond	IN	-87.513	41.627
V6829A	Burke Marketing Corporation	Nevada	IA	-93.439	42.008
V6839	Frozen Specialties, Inc.	Archbold	OH	-84.297	41.516
V6844	Makowski's Real Sausage Company	Lansing	IL	-87.545	41.592
V687	Albert Lea Select Foods Inc.	Albert Lea	MN	-93.348	43.68
V6878	Okane Forwarding, LLC.	Hidalgo	TX	-98.256	26.112
V6899	AMPC, LLC.	Lytton	IA	-94.86	42.422
V69	Intactics LLC	Nogales	AZ	-110.961	31.394
V6916	Amity Packing Co. Inc.	Chicago	IL	-87.733	41.816
V6922	Zick's Specialty Meats, Inc.	Berrien Springs	MI	-86.338	41.949
V6944	Fontanini Foods, LLC	McCook	IL	-87.838	41.799
V6945	Butterfield Foods, LLC	Noblesville	IN	-86.027	40.045
V6961	Pohlmans Meat Processing Plant	Terre Haute	IN	-87.512	39.303
V70	Seafrigo Coldstorage Miami Inc	Miami	FL	-80.305	25.803
V7055	Brown's Meat Locker	Stratford	TX	-102.064	36.322
V7066	J Bar B Foods	Waelder	TX	-97.298	29.692
V7066A	J Bar B Foods	Weimar	TX	-96.802	29.699
V7085	Tyson Foods, Inc	Broken Bow	OK	-94.74	34.05
V7100	Tyson Foods, Inc.	Nashville	AR	-93.847	33.928
V7147	4G Meat Processing LLC	Kansas City	MO	-94.552	39.118
V7156	Tyson Foods, Inc.	Hope	AR	-93.613	33.741
V717	Smithfield Fresh Meats Corp.	Denison	IA	-95.36	42.028
V717W	Smithfield Packaged Meats Corp.	Wichita	KS	-97.382	37.652
V7189	Ponderosa Meat Co.	Reno	NV	-119.806	39.512
V7195	Speedy Foods LLC	Commerce City	CO	-104.906	39.786
V7202	Sugar Creek Packing co.	Frontenac	KS	-94.723	37.454
V7251X	Mennonite Central Committee	Ephrata	PA	-76.183	40.192
V7251Z	Mennonite Central Committee U.S.	Newton	KS	-97.344	38.079
V7264	Sanderson Farms, Inc.	Hammond	LA	-90.508	30.505
V727	Simmons Prepared Foods, Inc.	South West City	MO	-94.599	36.544
V72A	RSF Inc. DBA Freezpak Logistics	Carteret	NJ	-74.216	40.566
V7333	Manchester Farms, Inc.	Hopkins	SC	-80.873	33.905
V7342	Wayne Farms LLC	Dothan	AL	-85.363	31.225
V7353	Colorado Boxed Beef Co.	Lakeland	FL	-81.946	28.048
V7356	Dinos Farm LLC	Warsaw	KY	-84.785	38.82
V74	Lineage Logistics PFS, LLC	Lynden	WA	-122.498	48.944
V7413	Elevation Foods, LLC	Knoxville	TN	-83.85	36.028
V7415	HOFFMAN'S QUALITY MEATS	HAGERSTOWN	MD	-77.753	39.677
V7420	Honest Meats, LLC	Harrisonburg	VA	-78.863	38.465
V7428	Joyce Foods, Inc.	Winston Salem	NC	-80.374	36.041
V7435	Americold	Piedmont	SC	-82.382	34.727
V7439	Cheney OFS, Inc.	Greensboro	NC	-79.973	36.087
V7446	Rudolph Foods Company, Inc	New Hebron	MS	-89.989	31.741
V7455	Williams Sausage Company, Inc.	Union City	TN	-89.162	36.479
V7467	Specialty Foods Group, LLC	Owensboro	KY	-87.133	37.778
V7470A	Mountaire Farms	Lumber Bridge	NC	-79.103	34.868
V748	Square H Brands, Inc.	Los Angeles	CA	-118.22	34.012
V7483	Saval Foods Corporation	Baltimore	MD	-76.559	39.299
V7483A	Deli Brands of America	BALTIMORE	MD	-76.671	39.256
V7485	Wayne Farms LLC	Jack	AL	-85.9	31.501
V7491	Carey & Schnalzer's Quality Meats (Slate Belt Butchery)	New Tripoli	PA	-75.749	40.693
V7502	Sugar Creek Packing Co.	Carthage	MO	-94.327	37.199
V7559	David Elliot Poultry Farm Inc.	Scranton	PA	-75.682	41.389
V757	The Hillshire Brands Company	Storm Lake	IA	-95.184	42.639
V76	San Luis International Cold Storage Services LLC	San Luis	AZ	-114.693	32.464
V7602	M&W Beef Packers Inc.	Mandan	ND	-100.895	46.832
V7603	Cloverdale Foods Co.	Mandan	ND	-100.932	46.857
V7610	Fargo Packing Company	West Fargo	ND	-96.896	46.876
V7611	Casselton Cold Storage Inc.	Casselton	ND	-97.212	46.901
V7615	Fairmount Lockers	Fairmount	ND	-96.605	46.055
V7622	Langdon Locker, LLC	Langdon	ND	-98.373	48.757
V7641	Myers Meats And Specialties	Parshall	ND	-102.085	47.769
V7644	Yellowstone River Beef	Williston	ND	-103.603	48.139
V7650	Missouri River Meats	Great Falls	MT	-111.266	47.515
V7679	Ranchers' Best Meats	Miles City	MT	-105.806	46.445
V768	Tyson Foods, Inc.	Waldron	AR	-94.102	34.904
V7697	Castle Rock Meats, Inc.	Denver	CO	-104.977	39.788
V770	Hometown Food Company	Milton	PA	-76.856	41.012
V7714	Carmine Lonardo's Inc.	Lakewood	CO	-105.081	39.69
V7717	White's Wholesale Meats	Ronan	MT	-114.064	47.53
V7718	Glacier Processing Cooperative	Columbia Falls	MT	-114.164	48.312
V772	Lombardi Brothers Meats LLC	Denver	CO	-104.916	39.775
V7722	Smith Meat Company, LLC	Rigby	ID	-111.9	43.688
V7748	Colorado Homestead Ranches, Inc.	Delta	CO	-108.08	38.741
V7769A	Farbest Foods, Inc.	Huntingburg	IN	-86.978	38.307
V7777	Minnesota Meat Masters	Annandale	MN	-94.109	45.259
V7779	Randolph Packing Company	Streamwood	IL	-88.177	42.005
V7785	Huettl's Locker & Dressing Plant	Lake City	MN	-92.288	44.463
V7812	Finger Food Products, LLC	Sanborn	NY	-78.92	43.114
V783	Harris Ranch Beef Company	Selma	CA	-119.616	36.498
V7831	Milmar Food Group II, LLC	Goshen	NY	-74.36	41.399
V7875	Joe Jurgielewicz & Son, Ltd.	Hamburg	PA	-76.02	40.526
V7875A	Joe Jurgielewicz & Son, Ltd.	Leesport	PA	-75.956	40.443
V7877A	Rastelli	Swedsboro	NJ	-75.377	39.752
V7877B	Rastelli Global	Swedesboro	NJ	-75.365	39.769
V7877C	Rastelli's Export	South Harrison Twp	NJ	-75.255	39.721
V7878	Thumann Inc.	Carlstadt	NJ	-74.071	40.83
V7886	K & K Gourmet Meats, Inc.	Leetsdale	PA	-80.219	40.572
V791	Clemens Food Group, LLC	Hatfield	PA	-75.322	40.269
V7914	Creation Gardens	Louisville	KY	-85.506	38.275
V7928	Halpern's Steak and Seafood	Baltimore	MD	-76.626	39.28
V7935	Cargill Meat Solutions	Timberville	VA	-78.783	38.635
V7942	Gino's Bar-B-Q Inc	Smithville	TN	-85.836	35.96
V794A	Hometown Food Company	Milton	PA	-76.853	41.0
V795	Monogram Meat Snacks, LLC	Martinsville	VA	-79.871	36.731
V7975	Piedmont Custom Meats, Inc.	Gibsonville	NC	-79.521	36.254
V7975A	Piedmont Custom Meats, Inc.	Asheboro	NC	-79.844	35.684
V8	Iowa Premium, LLC	Tama	IA	-92.549	41.958
V8030	Jim David Farm Fresh Meats	Uniontown	KY	-87.901	37.746
V8030A	Mid-South Sales, LLC	Uniontown	KY	-87.903	37.745
V8030B	Little Kentucky Smokehouse	Uniontown	KY	-87.903	37.744
V8078	Boone's Abattoir, Inc.	Bardstown	KY	-85.46	37.81
V8083	Palmer Farms Meats	Benton	KY	-88.348	36.865
V8091	Magnolia Provision Co., Inc.	Knoxville	TN	-83.933	36.016
V81	Lineage Logistics PFS, LLC	Kearny	NJ	-74.131	40.752
V8107	Squab Producers Of California	Modesto	CA	-120.989	37.607
V8112	Grand Peaks Prime Meats	Idaho Falls	ID	-112.044	43.48
V8118	Wasatch Meats, Inc.	Salt Lake City	UT	-111.896	40.749
V8119	Producers Meat & Provision	San Diego	CA	-116.977	32.565
V8120	Wood's Meat Processing, Inc.	Sandpoint	ID	-116.541	48.382
V8131	Blue Ribbon Processing, LLC	Fowler	CO	-104.021	38.131
V818	HK Cooperative, Inc.	Sandusky	OH	-82.758	41.4
V81A	Bar-S Foods Company	Altus	OK	-99.293	34.635
V81E	Bar-S Foods Co.	Elk City	OK	-99.388	35.407
V8205	Affiliated Fresh Cuts, LLC	Amarillo	TX	-101.817	35.229
V824	Crescent Duck Farm, Inc.'	Aquebogue	NY	-72.621	40.938
V8256	Legacy Food Company Inc,	Rancho Cucamonga	CA	-117.572	34.097
V8275	Settlers Jerky Inc.	Walnut	CA	-117.859	34.012
V83	B.Y. International Inc.	City of Industry	CA	-117.898	34.002
V8314	Swaggerty Sausage Company, Inc.	Kodak	TN	-83.592	35.956
V8327	Southeastern Provision, LLC	Bean Station	TN	-83.396	36.288
V833	Prasek's Hillje Smokehouse Inc.	El Campo	TX	-96.333	29.157
V833J	Prasek's Hillje Smokehouse	El Campo	TX	-96.334	29.158
V8389	Pasqualichio Brothers, Inc.	Jessup	PA	-75.547	41.465
V8406	Mennella'a Poultry	Paterson	NJ	-74.157	40.896
V8408	Jo Mar  Provisions Inc.	Pittsburgh	PA	-79.986	40.451
V8437	Koch's Turkey Farm	Tamaqua	PA	-76.035	40.726
V846	Americold Logistics LLC	West Memphis	AR	-90.23	35.125
V8498	Brenneman's Meat Market Inc	Huntingdon	PA	-78.028	40.488
V8507	IRP Meat & Seafood, CO	Telford	PA	-75.324	40.335
V853	The Sygma Network, Inc.	Columbus	OH	-83.066	39.971
V853B	The Sygma Network, Inc.	Clackamas	OR	-122.527	45.407
V8562	Godfrey Bros. Meats, Inc.	York	PA	-76.705	39.867
V8570A	Ragozzino Foods, Inc.	Meriden	CT	-72.815	41.541
V8575	Pellegrino Food Products Co., Inc.	Warren	PA	-79.138	41.854
V85O	Swift Pork Company	Ottumwa	IA	-92.394	41.004
V860	Chug Spring Butchery LLC	Chugwater	WY	-104.834	41.731
V8609	Wilmington Slaughter	New Wilmington	PA	-80.323	41.124
V863	Maloney Provisions	Pompano Beach	FL	-80.148	26.262
V8630	Benner's Butcher Shoppe, LLC	Thompsontown	PA	-77.226	40.567
V8638	Specialty Steak Service	Erie	PA	-80.042	42.139
V866	CTI Foods LLC	Wilder	ID	-116.913	43.696
V869	RSF Inc. DBA FreezPak Logistics	Hialeah	FL	-80.364	25.921
V8699	Wright City Meat	Wright City	MO	-91.0	38.826
V86F	Cargill Meat Solutions	Fort Worth	TX	-97.333	32.774
V8721	International Dehydrated Foods, Inc.	Monett	MO	-93.902	36.917
V8725	Golden City Meats, L.L.C.	Golden City	MO	-94.096	37.397
V8727	Butterball, LLC	Carthage	MO	-94.311	37.183
V874	Utah State University Meat Science Lab	Wellsville	UT	-111.889	41.669
V874A	USU Meat Laboratory	Logan	UT	-111.804	41.745
V8757	HVFG, LLC	Mongaup Valley	NY	-74.796	41.696
V881	Wells, Jenkins & Wells	Forest City	NC	-81.836	35.302
V8848A	Better Baked Foods, LLC	Erie	PA	-80.021	42.121
V885	Crowley Fresh	Medley	FL	-80.358	25.873
V8868	Montshire Packing, LLC	North Haverhill	NH	-72.01	44.084
V8888A	John F. Martin & Sons Inc.	Womelsdorf	PA	-76.185	40.37
V889	J.F. O'Neill Packing Co. Inc.	Omaha	NE	-95.959	41.219
V8892	Haass' Family Butcher Shop, Inc.	Dover	DE	-75.581	39.142
V89	The Hillshire Brands Company	Kansas City	KS	-94.684	39.096
V891	Costco Wholesale	Lantana	FL	-80.071	26.589
V893	Direct Fresh Wholesale & Export, Inc	West Palm Beach	FL	-80.107	26.708
V8935	RF Acquisition Corp.	Wapakoneta	OH	-84.166	40.554
V8948	Carlson Meat Shop	Grove City	MN	-94.681	45.152
V8951	Quality Meats and Culinary Specialties	Detroit	MI	-83.118	42.316
V8959	Dombrovski Meats Co. Inc.	Foley	MN	-93.911	45.665
V8993	Amylu Foods, LLC	Chicago	IL	-87.659	41.814
V9004	California State University, Chico - Meat Lab 9004	Chico	CA	-121.824	39.688
V901	Brother's Halal Meat Packing	Stamford	NY	-74.633	42.402
V904	Dietz & Watson, Inc.	Baltimore	MD	-76.657	39.326
V9041	Sturgis Meats LLC	Sturgis	SD	-103.528	44.418
V9059	Starnes Wholesale LLC	Paducah	KY	-88.617	37.054
V9065	Wampler's Farm Sausage Company, Inc.	Lenoir City	TN	-84.322	35.835
V907	Meritage Soups, LLC	Redmond	WA	-122.096	47.667
V9085	SAN Meat Packing Inc.	Afton	TN	-82.724	36.193
V913	Mello's North End Manufacturers	Fall River	MA	-71.152	41.718
V920	Exel Inc DBA DHL Supply Chain	Fort Worth	TX	-97.333	32.981
V9200	Chalet Market Inc.	Belgrade	MT	-111.184	45.764
V9202	Columbia Empire Meat Co., Inc.	Portland	OR	-122.653	45.495
V921	Paradise Market	Medina	MN	-93.545	45.044
V9221	Childers Meat Company	Eugene	OR	-123.187	44.113
V9228	Carlton Packing Company	Carlton	OR	-123.204	45.292
V923	Glutenlibre	Carlstadt	NJ	-74.08	40.831
V9237	Reed and Hertig Packing Co	Warrenton	OR	-123.918	46.092
V9246	Crystal Creek Meats	Roseburg	OR	-123.274	43.217
V9251	Family Loompya Corporation	National City	CA	-117.105	32.659
V9252	Bright Oak Meats, Inc.	Springfield	OR	-122.913	44.142
V9264	Malco's Buxton Meat Co	Sandy	OR	-122.281	45.43
V9267B	BrucePac	Woodburn	OR	-122.843	45.133
V9268	Tyson Fresh Meats, Inc.	Wallula	WA	-118.916	46.139
V9270	Mt. Angel Meat Co.	Mount Angel	OR	-122.792	45.09
V928	Stone Mountain Meats	Greeneville	TN	-82.797	36.343
V9287	Ovid Meat Co., LLC	Ovid	CO	-102.388	40.959
V9301	Jake's Food Service LLC	Vancouver	WA	-122.636	45.655
V9366	McDonald Meats Inc.	Girard	PA	-80.348	41.993
V9378	Baffoni's Poultry Farm Inc.	Johnston	RI	-71.489	41.839
V9379A	K. Heeps, Inc.	Allentown	PA	-75.574	40.593
V9400	Cargill Meat Solutions Corporation	Wyalusing	PA	-76.25	41.683
V9432	US Foods, DBA Stock Yards Meat Packing Co.	Greensburg	PA	-79.567	40.29
V9457	MRG Food LLC	McKeesport	PA	-79.879	40.344
V947	2 Creek Butchery, LLC	Monett	MO	-93.992	36.879
V9520	Leidy's, LLC	Souderton	PA	-75.32	40.3
V9542	Lemay and Sons Beef, LLC	Goffstown	NH	-71.521	42.992
V9553A	Godshall's Quality Meats Inc.	Souderton	PA	-75.356	40.28
V959	Peninsula Foodservice	Orlando	FL	-81.429	28.509
V963	RSF Inc. dba FreezPak Logistics	Bedford Park	IL	-87.75	41.765
V9640	Olde Tyme Meats, LLC	Chambersburg	PA	-77.679	39.962
V9646	Stoney Point Butchery, Inc.	Littlestown	PA	-77.11	39.734
V965	Interstate Meat Dist., Inc.	Clackamas	OR	-122.565	45.405
V965A	Interstate Meat Dist., Inc.	Clackamas	OR	-122.556	45.411
V966	University of Arizona Food Products & Safety Lab	Tucson	AZ	-110.944	32.283
V9687	Bixler Country Meats, Inc.	Hegins	PA	-76.583	40.649
V969	Swift Beef Company	Greeley	CO	-104.691	40.444
V9704	Springfield Meat Company, Inc.	Richlandtown	PA	-75.321	40.491
V976	Premier Distribution Center, LLC	Nogales	AZ	-110.961	31.348
V9760	Herring Brothers, Inc.	Guilford	ME	-69.32	45.176
V9760A	Herring Brothers, Inc.	Guilford	ME	-69.321	45.177
V978	John Volpi & Company, Inc.	St Louis	MO	-90.273	38.621
V9784	Leona Meat Plant Inc	Troy	PA	-76.738	41.797
V9819	Cabin Hollow Butcher Shop, Inc	Dillsburg	PA	-77.042	40.078
V9825	Sanford Butcher Shop	Sanford	ME	-70.821	43.422
V9840	Windham Butcher Shop Inc.	Windham	ME	-70.402	43.838
V9882A	Busseto Foods	Fresno	CA	-119.833	36.761
V991	United Natural Foods, Inc.	Sarasota	FL	-82.539	27.393
V992	JoBurg Meats, LLC	Woodbridge	CT	-72.978	41.344
V996	United States Cold Storage	Bethlehem	PA	-75.365	40.682
V9979	Smith Valley Meats	Rich Creek	VA	-80.822	37.391
`;

let INDEX: Map<string, FsisEstablishment> | null = null;

/** Parse the blob once, on first lookup. */
function index(): Map<string, FsisEstablishment> {
  if (INDEX) return INDEX;
  const m = new Map<string, FsisEstablishment>();
  for (const line of BLOB.split('\n')) {
    if (!line) continue;
    const [est, name, city, state, lon, lat] = line.split('\t');
    m.set(est, {
      establishmentNumber: est,
      name, city, state,
      lon: Number(lon), lat: Number(lat),
    });
  }
  INDEX = m;
  return m;
}

/**
 * Resolve an establishment number read off the USDA inspection mark.
 *
 * Accepts the forms that actually appear on packs: 'EST. 12345', 'P-12345',
 * 'M12345', 'EST 34D'. Returns null rather than guessing -- an unmatched
 * number is a number we cannot place, not an invitation to approximate.
 */
export function lookupFsisEstablishment(
  raw: string | null | undefined,
): FsisEstablishment | null {
  if (!raw) return null;
  const cleaned = raw
    .toUpperCase()
    .replace(/EST(ABLISHMENT)?\.?\s*/g, '')
    .replace(/[\s-]/g, '')
    .trim();
  if (!cleaned) return null;
  const m = index();
  const direct = m.get(cleaned);
  if (direct) return direct;
  // A bare number on the pack may be recorded with its activity prefix.
  if (/^[0-9]+[A-Z]*$/.test(cleaned)) {
    for (const prefix of ['M', 'P', 'V', 'G']) {
      const hit = m.get(prefix + cleaned);
      if (hit) return hit;
    }
  }
  return null;
}
