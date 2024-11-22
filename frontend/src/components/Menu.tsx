import React from 'react';
import { connect } from 'react-redux';
import { toggleMenu, toggleTimeFilter } from '../redux/actions/actions';
import { logoutUser } from '../redux/actions/authActions';
import { AppState } from '../redux/actions/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import Authentication from './Authentication';

interface MenuProps {
  menuOpen: boolean;
  timeFilterVisible: boolean;
  toggleMenu: (isOpen: boolean) => void;
  toggleTimeFilter: (isVisible: boolean) => void;
  logoutUser: () => void;
  isAuthenticated: boolean;
}

const Menu: React.FC<MenuProps> = ({ menuOpen, timeFilterVisible, toggleMenu, toggleTimeFilter, logoutUser, isAuthenticated }) => {
  return (
    <DropdownMenu open={menuOpen} onOpenChange={(isOpen: boolean) => toggleMenu(isOpen)}>
      <DropdownMenuTrigger className='menu-trigger'>
        <div className='menu-icon'>
          <div className='menu-icon-line'></div>
          <div className='menu-icon-line'></div>
          <div className='menu-icon-line'></div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='menu-content'>
        <div className='menu-content-inner'>
          <DropdownMenuItem className='menu-item'>
            {!isAuthenticated ? (
              <DropdownMenuItem className='menu-item'>
                <Authentication />
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className='menu-item' onClick={logoutUser}>
                Sign Out
              </DropdownMenuItem>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem className='menu-item' onClick={() => toggleTimeFilter(!timeFilterVisible)}>
            {timeFilterVisible ? 'Hide Time Filter' : 'Show Time Filter'}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const mapStateToProps = (state: AppState) => ({
  menuOpen: state.menuOpen,
  timeFilterVisible: state.timeFilterVisible,
  isAuthenticated: state.auth.isAuthenticated,
});

const mapDispatchToProps = {
  toggleMenu,
  toggleTimeFilter,
  logoutUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
