# Entwurf: Anfrage zur Nutzung des PoB2-Unique-Planerdatensatzes

Status: `not-pursued` – nicht versendet, nicht zur Versendung vorgesehen.

Historie: 5M.2.8A bereitete diesen konservativen Klärungsweg vor. Der
Auftraggeber hat in 5M.2.8B ausdrücklich entschieden, keine externe
Einzelfreigabe anzufragen. Es liegt daher weder eine Antwort noch eine
Genehmigung vor. Der Text bleibt ausschließlich als Entscheidungsverlauf
erhalten.

Hello Path of Building Community maintainers,

we maintain a free, open-source Path of Exile 2 web build planner published
through GitHub Pages. We would like to use a narrowly reduced subset of the
static Unique planner records shipped in
`PathOfBuildingCommunity/PathOfBuilding-PoE2`, pinned to commit
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

The proposed process would:

- read only 20 individually pinned and hashed files under
  `src/Data/Uniques/*.lua`;
- normalize only Unique names, planner base/slot labels, requirements,
  visible modifier expressions, structured planner roll ranges, variants and
  legacy markers needed by the build planner;
- distribute a reduced, source-labelled data set with the web app;
- not mirror the PoB2 database or source Lua files;
- not include images, icons, flavour text, user builds or unrelated PoB2 data;
- not make runtime requests or hotlink PoB2 content;
- not claim PoB2 identifiers or modifier lines to be official GGG technical
  Unique, Mod or Stat identifiers; and
- visibly attribute Path of Building Community, the repository, exact commit
  and applicable licence notice.

Could you please confirm whether the PoB2 project permits this processing and
public distribution of the reduced derived Unique planner data set? Please
also tell us which attribution text and licence notices you would prefer us to
include, and whether any of the static Unique files are outside the repository
MIT licence or have additional data-source conditions.

This request concerns only PoB2's permission and preferred attribution. We
will seek any separately required permission from Grinding Gear Games.
