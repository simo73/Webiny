<?php
namespace Apps\Core\Php\Entities;

use Apps\Core\Php\DevTools\Entity\AbstractEntity;
use Webiny\Component\Entity\EntityCollection;
use Webiny\Component\StdLib\StdObject\ArrayObject\ArrayObject;

/**
 * Class UserRole
 *
 * @property string           $name
 * @property string           $slug
 * @property ArrayObject      $permissions
 * @property EntityCollection $users
 *
 * @package Apps\Core\Php\Entities
 *
 */
class UserRole extends AbstractEntity
{
    protected static $entityCollection = 'UserRoles';
    protected static $entityMask = '{name}';

    public function __construct()
    {
        parent::__construct();

        $this->attr('name')->char()->setValidators('required')->setToArrayDefault()->onSet(function($name){
            if (!$this->slug && !$this->exists()) {
                $this->slug = $this->str($name)->slug()->val();
            }
            return $name;
        });

        $this->attr('slug')->char()->setValidators('required,unique')->onSet(function ($slug) {
            return $this->str($slug)->slug()->val();
        })->setToArrayDefault();

        $this->attr('description')->char()->setValidators('required')->setToArrayDefault();
        $this->attr('users')->many2many('User2UserRole')->setEntity('\Apps\Core\Php\Entities\User');
        $this->attr('permissions')->many2many('UserRole2UserPermission')->setEntity('\Apps\Core\Php\Entities\UserPermission');
    }

    /**
     * Check if this role has the requested $permission on given $item
     *
     * @param string $item
     * @param string $permission
     *
     * @return bool
     */
    public function checkPermission($item, $permission)
    {
        /* @var UserPermission $p */
        foreach ($this->permissions as $p) {
            if ($p->checkPermission($item, $permission)) {
                return true;
            }
        }

        return false;
    }
}