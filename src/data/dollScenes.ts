export interface DollSceneItem {
  id: string;
  action: string;
  category?: string;
}

export const DOLL_SCENES: DollSceneItem[] = [
  // 1. مواقف يومية وطريفة (Daily & Funny)
  { id: 'ds_01', action: 'صب قهوة عربية بالدلة وهز الفنجال', category: 'يومي' },
  { id: 'ds_02', action: 'تغيير كفر سيارة مبنشر في عز الظهر', category: 'يومي' },
  { id: 'ds_03', action: 'حلاقة دقن بالموس قدام مراية مكسورة', category: 'يومي' },
  { id: 'ds_04', action: 'تقطيع بصل مع بكاء ودموع حارقة', category: 'طريف' },
  { id: 'ds_05', action: 'كي ثوب رسمي والغترة مستعجل على دوام', category: 'يومي' },
  { id: 'ds_06', action: 'واحد يدوّر جواله وهو بيده ويكلم فيه', category: 'طريف' },
  { id: 'ds_07', action: 'صدم أصبع رجله الصغير في زاوية الباب', category: 'طريف' },
  { id: 'ds_08', action: 'محاولة فتح شطرطون ضايعة بدايته', category: 'طريف' },
  { id: 'ds_09', action: 'تسليك سيفون الحمام خربان وفاض الماي', category: 'طريف' },
  { id: 'ds_10', action: 'تبديل لمبة سقف واقف على أطراف أصابعه', category: 'يومي' },
  { id: 'ds_11', action: 'تصوير سيلفي جماعي من زاوية عالية', category: 'يومي' },
  { id: 'ds_12', action: 'شرب شاي حار جداً وانحرق لسانه', category: 'طريف' },
  { id: 'ds_13', action: 'دخول مسبح بارد جداً برجله خطوة خطوة', category: 'طريف' },
  { id: 'ds_14', action: 'مشي على رمل الشاطئ الحار يركض حافي', category: 'طريف' },
  { id: 'ds_15', action: 'أكل ليمونة حامضة وتغميض الوجه', category: 'طريف' },

  // 2. رياضات وألعاب أولمبية (Sports & Olympics)
  { id: 'ds_16', action: 'تسديد ركلة جزاء حاسمة في نهائي كأس العالم', category: 'رياضة' },
  { id: 'ds_17', action: 'حارس مرمى يصد كورة طائرة بزاوية 90', category: 'رياضة' },
  { id: 'ds_18', action: 'رمي الرمح الأولمبي بكل قوة', category: 'رياضة' },
  { id: 'ds_19', action: 'رفع أثقال وزن ثقيل مع رجفة الركب', category: 'رياضة' },
  { id: 'ds_20', action: 'ملاكم ياكل ضربة قاضية ويترنح بالحلبة', category: 'رياضة' },
  { id: 'ds_21', action: 'قفز بالزانة فوق العارضة في الهواء', category: 'رياضة' },
  { id: 'ds_22', action: 'لاعب كرة سلة يسجل دانك وهو معلق بالشبكة', category: 'رياضة' },
  { id: 'ds_23', action: 'سحب حبل بكل استماتة في لعبة شد الحبل', category: 'رياضة' },
  { id: 'ds_24', action: 'سبّاح يستعد للقفزة مع صفارة الانطلاق', category: 'رياضة' },
  { id: 'ds_25', action: 'ركوب أمواج وركبة منحنية على اللوح', category: 'رياضة' },
  { id: 'ds_26', action: 'فارس متمسك بلجام الخيل في سباق قفز الحواجز', category: 'رياضة' },
  { id: 'ds_27', action: 'لاعب بولينج يرمي الكرة ويتحمس مع دحرجة الكورة', category: 'رياضة' },
  { id: 'ds_28', action: 'حكم كورة يرفع الكرت الأحمر بوجه لاعب معترض', category: 'رياضة' },
  { id: 'ds_29', action: 'لاعب تايكوندو يركل ركلة دائرية بالهواء', category: 'رياضة' },
  { id: 'ds_30', action: 'تسلق جبل صخري شاهق والتعلق بيد واحدة', category: 'رياضة' },

  // 3. لقطات سينمائية ومشاهد أيقونية (Cinema & Iconic Scenes)
  { id: 'ds_31', action: 'تيتانيك: واقف على مقدمة السفينة وفاتح ذراعيه بالهواء', category: 'سينما' },
  { id: 'ds_32', action: 'ذا ماتريكس: نيو ينحني للخلف لتفادي الرصاص بالبطيء', category: 'سينما' },
  { id: 'ds_33', action: 'رجل الفضاء يطفو بدون جاذبية ويحاول يمسك مفتاح', category: 'سينما' },
  { id: 'ds_34', action: 'رجل الثلج يتجمد تدريجياً من البرد القارس', category: 'سينما' },
  { id: 'ds_35', action: 'زومبي يمشي ببطء مع يدين ممدودة ورجل عرجاء', category: 'سينما' },
  { id: 'ds_36', action: 'جاسوس يمشي على أطراف أصابعه متفادي ليزر المراقبة', category: 'سينما' },
  { id: 'ds_37', action: 'نينجا يقفز من فوق جدار ويستل سيف الكاتانا', category: 'سينما' },
  { id: 'ds_38', action: 'كاوبوي يستعد لسحب المسدس في مبارزة الصحراء', category: 'سينما' },
  { id: 'ds_39', action: 'طبيب جراح متوتر يطلب المشرط في عملية دقيقة', category: 'سينما' },
  { id: 'ds_40', action: 'ساحر يسحب حمامة أو أرنب من قبعته', category: 'سينما' },

  // 4. مواقف مهنية وحياتية شهيرة (Professions & Daily Challenges)
  { id: 'ds_41', action: 'مرشد طيران على المدرج يلوح بالعصي المضيئة للطيارة', category: 'مهن' },
  { id: 'ds_42', action: 'صياد سمك يسحب سمكة قرش عملاقة بالصنارة', category: 'مهن' },
  { id: 'ds_43', action: 'عازف عود يندمج ويعزف تقاسيم مع حركة الرأس', category: 'فنون' },
  { id: 'ds_44', action: 'رسام يدقق في اللوحة ويغمض عين ويقيس بالفرشاة', category: 'فنون' },
  { id: 'ds_45', action: 'مايسترو يقود فرقة موسيقية بحركات يدين حماسية', category: 'فنون' },
  { id: 'ds_46', action: 'طباخ شاورما يقص اللحم بالسكين الطويل باحتراف', category: 'مهن' },
  { id: 'ds_47', action: 'نجار يضرب مسمار بالشاكوش وضرب إصبعه بالغلط', category: 'مهن' },
  { id: 'ds_48', action: 'عامل بناء يشيل كيس سمنت على كتفه وظهره مقوس', category: 'مهن' },
  { id: 'ds_49', action: 'شرطي مرور يوقف سيارة متهورة وينفخ بالصفارة', category: 'مهن' },
  { id: 'ds_50', action: 'حفار يحفر الأرض بـ دريل كهربائي يهتز كامل جسمه', category: 'مهن' },

  // 5. حركات ومواقف هزلية إضافية (Comedic Extra)
  { id: 'ds_51', action: 'واحد يركض وراء باص فاته ويأشر بيده يترجاه', category: 'طريف' },
  { id: 'ds_52', action: 'تنويم مغناطيسي يتأرجح وينام فجأة واقفا', category: 'طريف' },
  { id: 'ds_53', action: 'واحد يتزحلق على قشرة موزة ويطيح على ظهره', category: 'طريف' },
  { id: 'ds_54', action: 'حمل طفل يبكي ويحاول يسكت فيه ويهزه', category: 'يومي' },
  { id: 'ds_55', action: 'تمثيل تمثال الشمع في المتحف بدون رمشة عين', category: 'طريف' },
  { id: 'ds_56', action: 'شخص معلق في حبل الغسيل من قميصه', category: 'طريف' },
  { id: 'ds_57', action: 'واحد حامل بطيختين كبار ويكاد يسقطون منه', category: 'طريف' },
  { id: 'ds_58', action: 'حارس أمن يشيك جهاز كشف المعادن على مسافر', category: 'مهن' },
  { id: 'ds_59', action: 'عازف درامز مجنون يضرب الصنوج بقوة وطاقة عالية', category: 'فنون' },
  { id: 'ds_60', action: 'واحد يطرد ذبابة مزعجة تحوم حول وجهه', category: 'طريف' },
];

export const PUPPET_ACTIONS_BANK = DOLL_SCENES;

export function getRandomDollScene(usedIds: Set<string> = new Set()): DollSceneItem {
  const pool = DOLL_SCENES.filter((item) => !usedIds.has(item.id));
  if (pool.length === 0) {
    return DOLL_SCENES[Math.floor(Math.random() * DOLL_SCENES.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
