# Сверка учебных формулировок

Проверено 10 октября 2026 перед локальным превью `/compute/`.

- [University of Wisconsin–Madison, лекция о сумматорах](https://pages.cs.wisc.edu/~dusseau/Classes/CS202-Oldish/Lectures/lecture-sequential.pdf), страницы 5–6: полный сумматор имеет входы `A`, `B`, `Cin` и выходы `S`, `Cout`; четыре блока можно связать переносом от младшего разряда к старшему. Это соответствует шагам 4–7 и таблице.
- [MIT OpenCourseWare, Computation Structures](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c8/c8s1/): перенос зависит от предыдущего блока; это основание последовательного показа цепочки. Реальная задержка вентилей, такты и микрокоманды здесь не моделируются.
- [WHATWG HTML Standard, `type=number`](https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)): недопустимая числовая строка очищается до пустой, поэтому интерфейс использует текстовое поле и собственную проверку точного формата. [Раздел `inputmode`](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute) описывает подсказку цифровой клавиатуры; она не заменяет валидацию.

Словарь `src/content/arithmetic/copy.ts` проверен: формула `aᵢ + bᵢ + cᵢ`, `c₀ = 0`, движение переноса справа налево, `s₄ = c₄`, десятичный разбор по весам. Подписи «условный» и «логическая модель» отделяют учебный путь от буквального маршрута по дорожкам платы. Пятибитный регистр результата — только решение данной модели, не универсальное правило ширины регистров CPU.
