import { NavDropdown } from 'react-bootstrap';

export default function LanguageSelector(props) {
    const availableLocales = props.loc.getBatch(props.loc.availableLocales)

    return (
        <NavDropdown title={props.title} onClick={props.onLanguageChanged} alignRight>
        {
          availableLocales.map(function(locale) {
            return <NavDropdown.Item key={locale.key} id={locale.key}>{locale.value}</NavDropdown.Item>
          })
        }
        </NavDropdown>
    )
}