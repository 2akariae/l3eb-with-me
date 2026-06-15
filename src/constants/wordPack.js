// wordPack.js — v10-fixed-b2
// Categories are now SHORT 1-2 word labels, not descriptive sentences.
export const WORD_PACKS = [
  {
    name: 'Places',
    words: [
      { word:{ en:'Airport',      ar:'مطار'           }, hint:{ en:'Travel',     ar:'سفر'      } },
      { word:{ en:'Hospital',     ar:'مستشفى'         }, hint:{ en:'Health',      ar:'صحة'       } },
      { word:{ en:'Bank',         ar:'بنك'              }, hint:{ en:'Finance',     ar:'مال'       } },
      { word:{ en:'Casino',       ar:'كازينو'          }, hint:{ en:'Games',       ar:'ترفيه'      } },
      { word:{ en:'University',   ar:'جامعة'           }, hint:{ en:'Education',   ar:'تعليم'      } },
      { word:{ en:'Stadium',      ar:'ملعب'            }, hint:{ en:'Sports',      ar:'رياضة'      } },
      { word:{ en:'Mosque',       ar:'مسجد'            }, hint:{ en:'Religion',    ar:'دين'        } },
      { word:{ en:'Prison',       ar:'سجن'              }, hint:{ en:'Justice',     ar:'قانون'      } },
      { word:{ en:'Museum',       ar:'متحف'            }, hint:{ en:'Culture',     ar:'ثقافة'      } },
      { word:{ en:'Market',       ar:'سوق'              }, hint:{ en:'Commerce',    ar:'تجارة'      } },
      { word:{ en:'Farm',         ar:'مزرعة'           }, hint:{ en:'Nature',      ar:'طبيعة'      } },
      { word:{ en:'Space Station',ar:'محطة فضائية'    }, hint:{ en:'Science',     ar:'علوم'       } },
      { word:{ en:'Restaurant',   ar:'مطعم'           }, hint:{ en:'Food',        ar:'طعام'       } },
      { word:{ en:'Library',      ar:'مكتبة'           }, hint:{ en:'Education',   ar:'تعليم'      } },
      { word:{ en:'Embassy',      ar:'سفارة'           }, hint:{ en:'Politics',    ar:'سياسة'      } },
      { word:{ en:'Theater',      ar:'مسرح'            }, hint:{ en:'Arts',        ar:'فنون'       } },
      { word:{ en:'Laboratory',   ar:'مختبر'          }, hint:{ en:'Science',     ar:'علوم'       } },
      { word:{ en:'Hotel',        ar:'فندق'            }, hint:{ en:'Travel',      ar:'سفر'       } },
      { word:{ en:'Police Station',ar:'مركز شرطة'    }, hint:{ en:'Justice',     ar:'قانون'      } },
      { word:{ en:'Gym',          ar:'صالة رياضية'     }, hint:{ en:'Sports',      ar:'رياضة'      } },
      { word:{ en:'Cinema',       ar:'سينما'          }, hint:{ en:'Arts',        ar:'فنون'       } },
      { word:{ en:'Zoo',          ar:'حديقة حيوان'    }, hint:{ en:'Nature',      ar:'طبيعة'      } },
      { word:{ en:'Submarine',    ar:'غواصة'          }, hint:{ en:'Military',    ar:'عسكري'      } },
      { word:{ en:'Cruise Ship',  ar:'سفينة سياحية'  }, hint:{ en:'Travel',      ar:'سفر'       } },
      { word:{ en:'Supermarket',  ar:'سوبرماركت'       }, hint:{ en:'Commerce',    ar:'تجارة'      } },
    ],
  },
  {
    name: 'Vehicles',
    words: [
      { word:{ en:'Helicopter',  ar:'مروحية'          }, hint:{ en:'Aviation',    ar:'طيران'      } },
      { word:{ en:'Ambulance',   ar:'إسعاف'           }, hint:{ en:'Health',      ar:'صحة'       } },
      { word:{ en:'Tanker',      ar:'ناقلة نفط'       }, hint:{ en:'Industry',    ar:'صناعة'      } },
      { word:{ en:'Race Car',    ar:'سيارة سباق'     }, hint:{ en:'Sports',      ar:'رياضة'      } },
      { word:{ en:'Train',       ar:'قطار'             }, hint:{ en:'Travel',      ar:'سفر'       } },
      { word:{ en:'Sailboat',    ar:'قارب شراعي'     }, hint:{ en:'Travel',      ar:'سفر'       } },
    ],
  },
  {
    name: 'Professions',
    words: [
      { word:{ en:'Surgeon',    ar:'جراح'           }, hint:{ en:'Health',      ar:'صحة'      } },
      { word:{ en:'Judge',      ar:'قاضي'           }, hint:{ en:'Justice',     ar:'قانون'     } },
      { word:{ en:'Astronaut',  ar:'رائد فضاء'      }, hint:{ en:'Science',     ar:'علوم'      } },
      { word:{ en:'Chef',       ar:'طاهٍ'          }, hint:{ en:'Food',        ar:'طعام'      } },
      { word:{ en:'Detective',  ar:'محقق'          }, hint:{ en:'Justice',     ar:'قانون'     } },
      { word:{ en:'Pilot',      ar:'طيار'          }, hint:{ en:'Aviation',    ar:'طيران'     } },
      { word:{ en:'Teacher',    ar:'معلم'          }, hint:{ en:'Education',   ar:'تعليم'     } },
      { word:{ en:'Firefighter',ar:'رجل إطفاء'     }, hint:{ en:'Safety',      ar:'أمن'       } },
    ],
  },
  {
    name: 'Events',
    words: [
      { word:{ en:'Wedding',    ar:'عرس'           }, hint:{ en:'Social',      ar:'اجتماعي'    } },
      { word:{ en:'Election',   ar:'انتخابات'        }, hint:{ en:'Politics',    ar:'سياسة'     } },
      { word:{ en:'Olympics',   ar:'أولمبياد'         }, hint:{ en:'Sports',      ar:'رياضة'     } },
      { word:{ en:'Concert',    ar:'حفل موسيقي'     }, hint:{ en:'Arts',        ar:'فنون'      } },
      { word:{ en:'Graduation', ar:'تخرج'          }, hint:{ en:'Education',   ar:'تعليم'     } },
      { word:{ en:'Auction',    ar:'مزاد'          }, hint:{ en:'Commerce',    ar:'تجارة'     } },
    ],
  },
];

export function getRandomWord() {
  const flat = WORD_PACKS.flatMap(pack => pack.words);
  return flat[Math.floor(Math.random() * flat.length)];
}

